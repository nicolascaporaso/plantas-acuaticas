const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "..");
const SITE_URL = "https://plantasacuaticas.com.ar";
const SOURCE_FILE = path.join(ROOT_DIR, "data.json");
const OUTPUT_FILE = path.join(ROOT_DIR, "plantas.json");
const SITEMAP_FILE = path.join(ROOT_DIR, "sitemap.xml");
const ROBOTS_FILE = path.join(ROOT_DIR, "robots.txt");
const REDIRECTS_FILE = path.join(ROOT_DIR, "_redirects");
const FICHAS_DIR = path.join(ROOT_DIR, "paginas", "fichas");
const PLANTAS_DIR = path.join(ROOT_DIR, "plantas");
const IMAGES_DIR = path.join(ROOT_DIR, "imagenes", "tienda");
const HOME_URL = "/index.html";
const STORE_URL = "/paginas/tienda.html";
const PLANTS_HUB_URL = "/plantas/";
const FICHA_CSS_URL = "/paginas/fichas/css/estilo.css";
const COMMERCIAL_BASE_URL = "https://plantasacuaticasba.onrender.com/";
const COMMERCIAL_PRODUCTS_URL = "https://plantasacuaticasba.onrender.com/products";

function readJson(filePath, fallback = null) {
    if (!fs.existsSync(filePath)) {
        return fallback;
    }

    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeFile(filePath, content) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
}

function slugify(value) {
    return String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
}

function normalizeKey(value) {
    return slugify(value).replace(/-/g, "");
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function truncate(value, maxLength) {
    if (value.length <= maxLength) {
        return value;
    }

    return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function ensureNoTrailingSlash(value) {
    return value.endsWith("/") ? value.slice(0, -1) : value;
}

function toAbsoluteUrl(value) {
    const cleaned = toRootRelativePath(value);
    return `${ensureNoTrailingSlash(SITE_URL)}${cleaned}`;
}

function toRootRelativePath(value) {
    const cleaned = String(value || "")
        .replace(/^(\.\.\/)+/, "/")
        .replace(/\\/g, "/");
    return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

function fileExistsFromPublicPath(publicPath) {
    const normalized = String(publicPath || "")
        .replace(/\\/g, "/")
        .replace(/^(\.\.\/)+/, "")
        .replace(/^\//, "");
    return fs.existsSync(path.join(ROOT_DIR, normalized.replace(/\//g, path.sep)));
}

function findExistingGuideLinks(guideLinks) {
    return (guideLinks || [])
        .map((link) => ({ href: toRootRelativePath(link), exists: fileExistsFromPublicPath(link) }))
        .filter((item) => item.exists)
        .map((item) => item.href);
}

function resolveCommercialUrl(value) {
    const url = String(value || "").trim();

    if (!url || url === COMMERCIAL_BASE_URL) {
        return COMMERCIAL_PRODUCTS_URL;
    }

    return url;
}

function buildLegacyMaps() {
    const legacyPlants = readJson(OUTPUT_FILE, []);
    const byId = new Map();
    const byName = new Map();

    legacyPlants.forEach((plant) => {
        byId.set(String(plant.id), plant);
        byName.set(normalizeKey(plant.nombre), plant);
    });

    return { byId, byName };
}

function buildImageCandidates(commonName, scientificName, legacyPlant) {
    const candidates = [];
    const addCandidate = (value) => {
        if (!value) {
            return;
        }

        candidates.push(`${value}.jpg`);
        candidates.push(`${value}.png`);
        candidates.push(value);
    };

    if (legacyPlant?.imagen) {
        candidates.push(path.basename(legacyPlant.imagen));
    }

    addCandidate(commonName);
    addCandidate(commonName.replace(/\s+/g, ""));
    addCandidate(scientificName);
    addCandidate(scientificName.replace(/\s+/g, ""));
    addCandidate(normalizeKey(commonName));
    addCandidate(normalizeKey(scientificName));
    addCandidate(slugify(commonName));
    addCandidate(slugify(scientificName));

    return [...new Set(candidates)];
}

function resolveImagePath(commonName, scientificName, legacyPlant) {
    if (legacyPlant?.imagen && fileExistsFromPublicPath(legacyPlant.imagen)) {
        return toRootRelativePath(legacyPlant.imagen);
    }

    const candidates = buildImageCandidates(commonName, scientificName, legacyPlant);
    const imageFiles = fs.existsSync(IMAGES_DIR) ? new Set(fs.readdirSync(IMAGES_DIR)) : new Set();

    for (const candidate of candidates) {
        if (imageFiles.has(candidate)) {
            return `/imagenes/tienda/${candidate}`;
        }
    }

    const fallback = [...imageFiles][0];
    return fallback ? `/imagenes/tienda/${fallback}` : "";
}

function buildLegacyFilename(commonName, legacyPlant) {
    if (legacyPlant?.ficha?.legacyArchivo) {
        return legacyPlant.ficha.legacyArchivo;
    }

    if (legacyPlant?.ficha?.archivo) {
        return legacyPlant.ficha.archivo;
    }

    return `${normalizeKey(commonName)}.html`;
}

function buildCatalogDescription(item) {
    const parts = [
        item["nombre científico"] ? `Nombre científico: ${item["nombre científico"]}` : "",
        item.dificultad ? `Dificultad: ${item.dificultad}` : "",
        item["ubicación recomendada"] ? `Ubicación: ${item["ubicación recomendada"]}` : "",
        item.iluminación ? `Luz: ${item.iluminación}` : ""
    ].filter(Boolean);

    return truncate(parts.join(" | "), 180);
}

function buildSeoTitle(commonName, scientificName) {
    if (scientificName) {
        return `${commonName} (${scientificName}): cuidados, luz, temperatura y pH | Plantas Acuáticas`;
    }

    return `${commonName}: cuidados, luz, temperatura y pH | Plantas Acuáticas`;
}

function buildPrimaryQueryHeading(commonName, scientificName) {
    if (scientificName) {
        return `${commonName} (${scientificName}): ficha técnica y cuidados`;
    }

    return `${commonName}: ficha técnica y cuidados`;
}

function buildSeoDescription(item, commonName, scientificName) {
    const parts = [
        scientificName ? `${commonName} (${scientificName})` : commonName,
        item.dificultad ? `dificultad ${item.dificultad.toLowerCase()}` : "",
        item.iluminación ? `luz ${item.iluminación.toLowerCase()}` : "",
        item.temperatura ? `temperatura ${item.temperatura}` : "",
        item.pH ? `pH ${item.pH}` : "",
        item["ubicación recomendada"] ? `ubicación ${item["ubicación recomendada"]}` : ""
    ].filter(Boolean);

    return truncate(parts.join(", "), 160);
}

function buildIntro(item, commonName, scientificName) {
    const scientificText = scientificName ? ` (${scientificName})` : "";
    const originText = item.origen ? ` originaria de ${item.origen}` : "";
    const difficultyText = item.dificultad ? ` de dificultad ${item.dificultad.toLowerCase()}` : "";
    const growthText = item["velocidad de crecimiento"] ? ` y crecimiento ${item["velocidad de crecimiento"].toLowerCase()}` : "";

    return `${commonName}${scientificText} es una planta acuática${originText}${difficultyText}${growthText}, muy usada en acuarios plantados.`;
}

function buildBotanicData(item) {
    return [
        ["Nombre común", item["nombre común"]],
        ["Nombre científico", item["nombre científico"]],
        ["Familia", item.familia],
        ["Origen", item.origen],
        ["Dificultad", item.dificultad]
    ].filter((entry) => entry[1]);
}

function buildSizeData(item) {
    return [
        ["Altura", item.altura],
        ["Ancho", item.ancho],
        ["Velocidad de crecimiento", item["velocidad de crecimiento"]],
        ["Tipo de crecimiento", item["tipo de crecimiento"]],
        ["Ubicación recomendada", item["ubicación recomendada"]]
    ].filter((entry) => entry[1]);
}

function buildWaterAndLightData(item) {
    return [
        ["Temperatura", item.temperatura],
        ["pH", item.pH],
        ["GH / KH", item["GH/KH"]],
        ["Iluminación", item.iluminación],
        ["CO2", item["CO₂"]]
    ].filter((entry) => entry[1]);
}

function buildSystemData(item) {
    return [
        ["Fertilización", item.fertilización],
        ["Uso en low-tech / high-tech", item["uso en low-tech/high-tech"]],
        ["Uso en acuarios de agua fría", item["uso en acuarios de agua fría"]]
    ].filter((entry) => entry[1]);
}

function renderList(items) {
    return `<ul>${items
        .map(([label, value]) => `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`)
        .join("")}</ul>`;
}

function renderSection(title, innerHtml) {
    if (!innerHtml) {
        return "";
    }

    return `<section class="card"><div class="card__parrafo"><h2>${escapeHtml(title)}</h2>${innerHtml}</div></section>`;
}

function renderSubsection(title, innerHtml) {
    if (!innerHtml) {
        return "";
    }

    return `<div class="ficha-subsection"><h3>${escapeHtml(title)}</h3>${innerHtml}</div>`;
}

function renderTextSection(title, text) {
    if (!text) {
        return "";
    }

    return renderSection(title, `<p>${escapeHtml(text)}</p>`);
}

function renderLinksList(links) {
    return `<ul class="ficha-links">${links
        .map((item) => `<li><a href="${escapeHtml(item.href)}">${escapeHtml(item.label)}</a></li>`)
        .join("")}</ul>`;
}

function buildVisibleHeading(plant) {
    return buildPrimaryQueryHeading(plant.nombre, plant.nombreCientifico);
}

function buildBreadcrumbJsonLd(plant) {
    const canonicalUrl = toAbsoluteUrl(plant.ficha.ruta);

    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Inicio",
                item: toAbsoluteUrl(HOME_URL)
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Fichas de plantas acuáticas",
                item: toAbsoluteUrl(PLANTS_HUB_URL)
            },
            {
                "@type": "ListItem",
                position: 3,
                name: plant.nombre,
                item: canonicalUrl
            }
        ]
    };
}

function buildArticleJsonLd(plant) {
    const canonicalUrl = toAbsoluteUrl(plant.ficha.ruta);

    return {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: plant.seo.title,
        description: plant.seo.description,
        inLanguage: "es",
        mainEntityOfPage: canonicalUrl,
        about: plant.nombre,
        image: plant.imagen ? [toAbsoluteUrl(plant.imagen)] : [],
        author: {
            "@type": "Organization",
            name: "Plantas Acuaticas"
        },
        publisher: {
            "@type": "Organization",
            name: "Plantas Acuaticas",
            url: SITE_URL
        },
        url: canonicalUrl
    };
}

function buildJsonLd(plant) {
    return JSON.stringify([
        buildArticleJsonLd(plant),
        buildBreadcrumbJsonLd(plant)
    ], null, 2);
}

function buildBuyCta(plant) {
    const shopUrl = plant.tiendaUrl || COMMERCIAL_PRODUCTS_URL;
    const hasSpecificProduct = /\/buy\/code\//i.test(shopUrl);
    const buttonText = hasSpecificProduct ? `Comprar ${plant.nombre}` : "Ver tienda";

    return `
    <section class="ficha-cta" aria-labelledby="comprar-${plant.id}">
      <h2 id="comprar-${plant.id}" class="ficha-cta__titulo">Seguir con la compra</h2>
      <p class="ficha-cta__texto">Esta ficha es educativa. Si querés avanzar con la compra, te llevo a la tienda comercial.</p>
      <div class="ficha-cta__acciones">
        <a class="ficha-cta__boton ficha-cta__boton--primary" href="${escapeHtml(shopUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(buttonText)}</a>
        <a class="ficha-cta__boton ficha-cta__boton--secondary" href="${PLANTS_HUB_URL}">Ver más fichas</a>
      </div>
    </section>`;
}

function countPlantsByDifficulty(plants, pattern) {
    return plants.filter((plant) => pattern.test(String(plant.fuente.dificultad || ""))).length;
}

function countPlantsByLowTech(plants) {
    return plants.filter((plant) => /low-tech/i.test(String(plant.fuente["uso en low-tech/high-tech"] || ""))).length;
}

function renderHubStat(label, value) {
    return `<article class="hub-stat"><span class="hub-stat__value">${escapeHtml(value)}</span><span class="hub-stat__label">${escapeHtml(label)}</span></article>`;
}

function renderHubPlantCard(plant) {
    const scientificName = plant.nombreCientifico ? `<p class="hub-plant-card__scientific">${escapeHtml(plant.nombreCientifico)}</p>` : "";
    const meta = [
        plant.fuente.dificultad ? `Dificultad: ${plant.fuente.dificultad}` : "",
        plant.fuente.iluminación ? `Luz: ${plant.fuente.iluminación}` : "",
        plant.fuente["ubicación recomendada"] ? `Ubicación: ${plant.fuente["ubicación recomendada"]}` : ""
    ].filter(Boolean);

    const metaHtml = meta.length
        ? `<ul class="hub-plant-card__meta">${meta.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";

    return `<article class="hub-plant-card">
      <a class="hub-plant-card__link" href="${escapeHtml(plant.ficha.ruta)}">
        ${plant.imagen ? `<img class="hub-plant-card__image" src="${escapeHtml(toRootRelativePath(plant.imagen))}" alt="${escapeHtml(plant.altText)}">` : ""}
        <div class="hub-plant-card__content">
          <h3 class="hub-plant-card__title">${escapeHtml(plant.nombre)}</h3>
          ${scientificName}
          <p class="hub-plant-card__description">${escapeHtml(plant.seo.description)}</p>
          ${metaHtml}
          <span class="hub-plant-card__cta">Ver ficha técnica</span>
        </div>
      </a>
    </article>`;
}

function buildFichaBody(plant) {
    const imageBlock = plant.imagen
        ? `<section class="card"><div class="card__parrafo"><figure class="ficha-media"><img class="ficha-media__img" src="${escapeHtml(toRootRelativePath(plant.imagen))}" alt="${escapeHtml(plant.altText)}"><figcaption>${escapeHtml(plant.altText)}</figcaption></figure></div></section>`
        : "";

    const overviewSection = renderSection("Descripción general", `<p>${escapeHtml(buildIntro(plant.fuente, plant.nombre, plant.nombreCientifico))}</p>`);

    const technicalSection = renderSection(
        "Ficha técnica",
        [
            renderSubsection("Datos botánicos", renderList(buildBotanicData(plant.fuente))),
            renderSubsection("Tamaño y crecimiento", renderList(buildSizeData(plant.fuente)))
        ].join("")
    );

    const cultivationSection = renderSection(
        "Parámetros de cultivo",
        [
            renderSubsection("Agua y luz", renderList(buildWaterAndLightData(plant.fuente))),
            renderSubsection("Nutrientes y sistema", renderList(buildSystemData(plant.fuente)))
        ].join("")
    );

    const managementSection = renderSection(
        "Manejo en el acuario",
        [
            renderSubsection("Cómo plantarla", plant.fuente["cómo plantarla"] ? `<p>${escapeHtml(plant.fuente["cómo plantarla"])}</p>` : ""),
            renderSubsection("Cómo reproducirla", plant.fuente["cómo reproducirla"] ? `<p>${escapeHtml(plant.fuente["cómo reproducirla"])}</p>` : ""),
            renderSubsection("Problemas frecuentes", plant.fuente["problemas frecuentes"] ? `<p>${escapeHtml(plant.fuente["problemas frecuentes"])}</p>` : ""),
            renderSubsection("Algas asociadas", plant.fuente["algas asociadas"] ? `<p>${escapeHtml(plant.fuente["algas asociadas"])}</p>` : "")
        ].join("")
    );

    const compatibilitySection = renderSection(
        "Compatibilidad y uso",
        [
            renderSubsection("Compatibilidad con peces", plant.fuente["compatibilidad con peces"] ? `<p>${escapeHtml(plant.fuente["compatibilidad con peces"])}</p>` : ""),
            renderSubsection("Compatibilidad con gambas", plant.fuente["compatibilidad con gambas"] ? `<p>${escapeHtml(plant.fuente["compatibilidad con gambas"])}</p>` : "")
        ].join("")
    );

    const relatedSection = renderSection(
        "Recursos relacionados",
        [
            plant.relacionadas.length ? renderSubsection("Plantas similares", renderLinksList(plant.relacionadas)) : "",
            plant.guiasRelacionadas.length ? renderSubsection("Guías relacionadas", renderLinksList(plant.guiasRelacionadas)) : ""
        ].join("")
    );

    return [
        imageBlock,
        overviewSection,
        technicalSection,
        cultivationSection,
        managementSection,
        compatibilitySection,
        relatedSection
    ].filter(Boolean).join("");
}

function buildCanonicalFichaHtml(plant) {
    const canonicalUrl = toAbsoluteUrl(plant.ficha.ruta);
    const imageUrl = plant.imagen ? toAbsoluteUrl(plant.imagen) : "";
    const visibleHeading = buildVisibleHeading(plant);
    const bodyHtml = buildFichaBody(plant);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(plant.seo.title)}</title>
  <meta name="description" content="${escapeHtml(plant.seo.description)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:locale" content="es_AR">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${escapeHtml(plant.seo.title)}">
  <meta property="og:description" content="${escapeHtml(plant.seo.description)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  ${imageUrl ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">` : ""}
  ${imageUrl ? `<meta property="og:image:alt" content="${escapeHtml(plant.altText)}">` : ""}
  <meta property="og:site_name" content="Plantas Acuaticas">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(plant.seo.title)}">
  <meta name="twitter:description" content="${escapeHtml(plant.seo.description)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">` : ""}
  <script type="application/ld+json">
${buildJsonLd(plant)}
  </script>
  <link rel="stylesheet" href="${FICHA_CSS_URL}">
</head>
<body class="ficha-page">
  <main class="ficha-layout">
    <nav class="ficha-breadcrumbs" aria-label="Breadcrumb">
      <a href="${HOME_URL}">Inicio</a>
      <span>/</span>
      <a href="${PLANTS_HUB_URL}">Fichas de plantas acuáticas</a>
      <span>/</span>
      <span>${escapeHtml(plant.nombre)}</span>
    </nav>
    <header class="ficha-header">
      <h1 class="ficha-header__title">${escapeHtml(visibleHeading)}</h1>
      <p class="ficha-header__description">${escapeHtml(plant.seo.description)}</p>
    </header>
    ${bodyHtml}
    ${buildBuyCta(plant)}
  </main>
</body>
</html>
`;
}

function buildPlantsHubHtml(plants) {
    const alphabeticalPlants = [...plants].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    const beginnerPlants = alphabeticalPlants
        .filter((plant) => /f(a|á)cil|muy f(a|á)cil/i.test(String(plant.fuente.dificultad || "")))
        .slice(0, 6);
    const featuredCards = (beginnerPlants.length ? beginnerPlants : alphabeticalPlants.slice(0, 6))
        .map((plant) => renderHubPlantCard(plant))
        .join("");
    const allCards = alphabeticalPlants.map((plant) => renderHubPlantCard(plant)).join("");
    const totalPlants = plants.length;
    const beginnerCount = countPlantsByDifficulty(plants, /f(a|á)cil|muy f(a|á)cil/i);
    const mediumCount = countPlantsByDifficulty(plants, /media|moderad/i);
    const lowTechCount = countPlantsByLowTech(plants);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fichas de plantas acuáticas: índice completo | Plantas Acuáticas</title>
  <meta name="description" content="Listado completo de fichas técnicas de plantas acuáticas con enlaces HTML directos para descubrir cuidados, luz, temperatura, pH y compatibilidades.">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${escapeHtml(toAbsoluteUrl(PLANTS_HUB_URL))}">
  <meta property="og:locale" content="es_AR">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Fichas de plantas acuáticas: índice completo | Plantas Acuáticas">
  <meta property="og:description" content="Listado completo de fichas técnicas de plantas acuáticas con enlaces HTML directos.">
  <meta property="og:url" content="${escapeHtml(toAbsoluteUrl(PLANTS_HUB_URL))}">
  <meta property="og:site_name" content="Plantas Acuaticas">
  <link rel="stylesheet" href="${FICHA_CSS_URL}">
</head>
<body class="ficha-page">
  <main class="ficha-layout">
    <nav class="ficha-breadcrumbs" aria-label="Breadcrumb">
      <a href="${HOME_URL}">Inicio</a>
      <span>/</span>
      <span>Fichas de plantas acuáticas</span>
    </nav>
    <header class="ficha-header">
      <h1 class="ficha-header__title">Fichas de plantas acuáticas</h1>
      <p class="ficha-header__description">Accedé a todas las fichas técnicas importantes del sitio desde enlaces HTML directos, con navegación clara para usuarios y buscadores.</p>
    </header>

    <section class="hub-intro-grid">
      ${renderHubStat("fichas indexables", totalPlants)}
      ${renderHubStat("aptas para empezar", beginnerCount)}
      ${renderHubStat("nivel intermedio", mediumCount)}
      ${renderHubStat("opciones low-tech", lowTechCount)}
    </section>

    <section class="card hub-copy-card">
      <div class="card__parrafo">
        <h2>Cómo usar este índice</h2>
        <p>Esta página reúne todas las fichas técnicas importantes del sitio con enlaces HTML permanentes. Te sirve para encontrar rápido una planta por nombre común o científico, y también ayuda a Google a descubrir todas las URLs canónicas sin depender de JavaScript.</p>
        <div class="ficha-cta__acciones">
          <a class="ficha-cta__boton ficha-cta__boton--secondary" href="${STORE_URL}">Ir al catálogo comercial</a>
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card__parrafo">
        <h2>Plantas recomendadas para empezar</h2>
        <p>Si recién arrancás con acuarios plantados, estas fichas son una buena puerta de entrada porque suelen tener cuidados simples y buena tolerancia a errores.</p>
        <div class="hub-plant-grid">
          ${featuredCards}
        </div>
      </div>
    </section>

    <section class="card">
      <div class="card__parrafo">
        <h2>Índice completo de fichas</h2>
        <p>Entrá a cada ficha para ver cuidados, luz, temperatura, pH, plantado, reproducción y compatibilidades.</p>
        <div class="hub-plant-grid hub-plant-grid--compact">
          ${allCards}
        </div>
      </div>
    </section>
  </main>
</body>
</html>
`;
}

function buildStoreHtmlContent(plants) {
    const listItems = plants
        .map((plant) => `<li><a href="${escapeHtml(plant.ficha.ruta)}">${escapeHtml(plant.nombre)}</a></li>`)
        .join("");

    return `<!doctype html>
<html lang=es>

<head>
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-0JJDDTYN0T"></script>
    <script>
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());

        gtag('config', 'G-0JJDDTYN0T');
    </script>
    <meta charset=UTF-8>
    <meta http-equiv=X-UA-Compatible content="IE=edge">
    <meta name=viewport content="width=device-width,initial-scale=1">
    <meta name=description
        content="Plantas Acuáticas para Principiantes: Explora nuestro completo catálogo de plantas acuáticas y descubre una amplia variedad de especies junto con sus características únicas. Encuentra información detallada sobre cuidados, hábitats y más para crear el acuario perfecto. ¡Sumérgete en el fascinante mundo de la acuarofilia con nosotros">
    <meta name="keywords"
        content="topedegama28, un jardin bajo el agua, tienda online, https://maps.app.goo.gl/owfaRDHtynTZ1Sw98, tienda de plantas, tiendas plantas acuaticas, plantas acuaticas, acuarios, tutoriales acuarofilia, acuaticas de ribera, acuaticas flotantes, acuaticas oxigenadoras, cactus, suculentas, helechos, musgos, plantas carnivoras, jardineria">
    <meta name=author content="nicolas caporaso">
    <link rel="canonical" href="${escapeHtml(toAbsoluteUrl(STORE_URL))}">
    <meta name="robots" content="index, follow">
    <title>catálogo de plantas acuáticas: variedades y características</title>
    <script src=https://kit.fontawesome.com/eff7621339.js crossorigin=anonymous></script>
    <link href=../css/estilo.css rel=stylesheet>
    <link rel=preconnect href=https://fonts.googleapis.com>
    <link rel=preconnect href=https://fonts.gstatic.com crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Courgette&display=swap" rel=stylesheet>
</head>

<body>
    <header>
        <nav class=barra>
            <ul class="barra__lista pl-0 m-0">
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none"
                        href=https://plantasacuaticasba.onrender.com/> Tienda </a></li>
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none"
                        href=../index.html> <i class="fa-solid fa-house-chimney"></i></a></li>
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none" href=tienda.html>
                        Plantas Acuáticas </a></li>
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none" href=plantas.html>
                        Plantas Terrestres </a></li>
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none" href=galeria.html>
                        Galería de Acuarios </a></li>
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none" href=cursos.html>
                        Cursos </a></li>
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none"
                        href=./guiaBasica.html> Guia Basica Para Acuarios </a></li>
                <li class=barra__lista__item><a class="barra__lista__item__link text-decoration-none"
                        href=./guiaAvanzada.html> Guia Avanzada Para Acuarios </a></li>
            </ul>
        </nav>
        <div class=portada>
            <picture class=portada__picture>
                <source class=portada__picture__source srcset=../imagenes/banner/imagen-principalb.jpg
                    media="(min-width: 2685px)">
                <source class=portada__picture__source srcset=../imagenes/banner/imagen-principalb.jpg
                    media="(min-width: 1920px)">
                <source class=portada__picture__source srcset=../imagenes/banner/imagen-principalb.jpg
                    media="(min-width: 1320px)">
                <source class=portada__picture__source srcset=../imagenes/banner/imagen-principalb.jpg
                    media="(min-width: 1025px)">
                <source class=portada__picture__source srcset=../imagenes/banner/imagen-principalb.jpg
                    media="(min-width: 980px)">
                <source class=portada__picture__source srcset=../imagenes/banner/imagen-principalb.jpg
                    media="(min-width: 768px)">
                <source class=portada__picture__source srcset=../imagenes/banner/imagen-principalb.jpg
                    media="(min-width: 450px)">
                <img class=portada__picture__imagen src=../imagenes/banner/imagen-principalb.jpg
                    alt="fuente de agua al aire libre con Plantas Acuáticas flotantes">
            </picture>
            <h1 class=portada__titulo>PLANTASACUATICAS.COM.AR</h1>
        </div>
    </header>
    <main class=tienda>
        <h2 class=tienda__titulo>Explora nuestro completo listado de plantas acuáticas. Aquí encontrarás una guía breve
            pero informativa sobre cada especie, diseñada para ayudarte a elegir las plantas acuáticas perfectas para tu
            acuario.</h2>

        <h2 class=tienda__titulo>Haz clic en una imagen para abrir la ficha técnica completa...</h2>

        <section class="card" style="margin: 1rem auto; max-width: 1100px;">
            <div class="card__parrafo">
                <h2>Índice HTML de fichas</h2>
                <p>Para Google y otros buscadores, también dejamos un índice estático con enlaces directos a todas las fichas técnicas.</p>
                <p><a href="${PLANTS_HUB_URL}">Ver el índice completo de fichas de plantas acuáticas</a></p>
                <ul class="ficha-links ficha-links--columns">
                    ${listItems}
                </ul>
            </div>
        </section>

        <div id=tienda__grid class=tienda__grid></div>
    </main>
    <footer class=footer>
        <div class=footer__div>
            <h3 class=footer__div__titulo>Para estar al día con nuestras novedades, visita nuestras redes sociales.</h3>
            <a class=footer__div__link href="https://www.facebook.com/profile.php?id=61582745956564"><i
                    class="footer__div__link__ico fa-brands fa-facebook-square bg-facebook"></i></a>
            <a class=footer__div__link
                href="https://api.whatsapp.com/send?phone=+5491128078273&text=dejame%20tu%20mensaje%20de%20plantasacuaticas"><i
                    class="footer__div__link__ico fa-brands fa-whatsapp-square bg-whatssap"></i></a>
            <a class=footer__div__link href="https://www.instagram.com/plantasacuaticasBA/"><i
                    class="footer__div__link__ico fa-brands fa-instagram-square bg-instagram"></i></a>
            <a class="footer__div__link" href="https://maps.app.goo.gl/owfaRDHtynTZ1Sw98" target="_blank">
                <i class="footer__div__link__ico fa-solid fa-map-marker-alt bg-maps"></i>
            </a>
        </div>
    </footer>
    <script src=//cdn.jsdelivr.net/npm/sweetalert2@11></script>
    <script src=../js/tienda/generaweb.js></script>
</body>
</html>
`;
}

function buildLegacyRedirectHtml(plant) {
    const canonicalUrl = toAbsoluteUrl(plant.ficha.ruta);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(plant.ficha.ruta)}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <title>Redirigiendo a ${escapeHtml(plant.nombre)}</title>
</head>
<body>
  <p>Redirigiendo a <a href="${escapeHtml(plant.ficha.ruta)}">${escapeHtml(plant.nombre)}</a>.</p>
</body>
</html>
`;
}

function resolveRelatedPlants(names, plantRouteMap) {
    return (names || [])
        .map((name) => {
            const route = plantRouteMap.get(normalizeKey(name));
            return route ? { label: name, href: route } : null;
        })
        .filter(Boolean);
}

function normalizePlant(item, legacyMaps) {
    const commonName = item["nombre común"] || item.nombre || "Planta acuática";
    const scientificName = item["nombre científico"] || "";
    const legacyPlant = legacyMaps.byId.get(String(item.id)) || legacyMaps.byName.get(normalizeKey(commonName)) || null;
    const slug = item.slug || legacyPlant?.slug || slugify(commonName);
    const legacyArchivo = buildLegacyFilename(commonName, legacyPlant);
    const legacyRuta = legacyPlant?.ficha?.legacyRuta || legacyPlant?.ficha?.ruta || `/paginas/fichas/${legacyArchivo}`;
    const ruta = `/plantas/${slug}/`;
    const imagen = resolveImagePath(commonName, scientificName, legacyPlant);

    return {
        id: String(item.id),
        nombre: commonName,
        nombreCientifico: scientificName,
        slug,
        descripcionCatalogo: buildCatalogDescription(item),
        imagen,
        altText: item["ALT descriptivo"] || `${commonName} en un acuario plantado.`,
        tiendaUrl: resolveCommercialUrl(item.link || legacyPlant?.tiendaUrl),
        ficha: {
            legacyArchivo,
            legacyRuta,
            ruta
        },
        seo: {
            title: buildSeoTitle(commonName, scientificName),
            description: buildSeoDescription(item, commonName, scientificName)
        },
        relacionadasRaw: item["enlaces a plantas similares"] || [],
        guiasRelacionadasRaw: item["enlace a guías relacionadas"] || [],
        fuente: item
    };
}

function buildDerivedPlants(sourcePlants) {
    const legacyMaps = buildLegacyMaps();
    const normalizedPlants = sourcePlants.map((item) => normalizePlant(item, legacyMaps));
    const plantRouteMap = new Map();

    normalizedPlants.forEach((plant) => {
        plantRouteMap.set(normalizeKey(plant.nombre), plant.ficha.ruta);
        if (plant.nombreCientifico) {
            plantRouteMap.set(normalizeKey(plant.nombreCientifico), plant.ficha.ruta);
        }
    });

    return normalizedPlants.map((plant) => ({
        ...plant,
        relacionadas: resolveRelatedPlants(plant.relacionadasRaw, plantRouteMap),
        guiasRelacionadas: findExistingGuideLinks(plant.guiasRelacionadasRaw).map((href) => ({
            label: path.basename(href).replace(/\.[^.]+$/, "").replace(/-/g, " "),
            href
        }))
    }));
}

function serializePlants(plants) {
    const output = plants.map((plant) => ({
        id: plant.id,
        nombre: plant.nombre,
        nombreCientifico: plant.nombreCientifico,
        slug: plant.slug,
        descripcionCatalogo: plant.descripcionCatalogo,
        imagen: toRootRelativePath(plant.imagen),
        altText: plant.altText,
        tiendaUrl: plant.tiendaUrl,
        ficha: plant.ficha,
        seo: plant.seo,
        relacionadas: plant.relacionadas,
        guiasRelacionadas: plant.guiasRelacionadas,
        fuente: plant.fuente
    }));

    return `${JSON.stringify(output, null, 2)}\n`;
}

function generateSitemap(plants) {
    const staticPages = [
        { path: "/", changefreq: "weekly", priority: "1.0" },
        { path: "/plantas/", changefreq: "weekly", priority: "0.9" },
        { path: "/paginas/cursos.html", changefreq: "monthly", priority: "0.8" },
        { path: "/paginas/galeria.html", changefreq: "monthly", priority: "0.6" },
        { path: "/paginas/plantas.html", changefreq: "monthly", priority: "0.8" },
        { path: "/paginas/tienda.html", changefreq: "weekly", priority: "0.9" },
        { path: "/paginas/guiaBasica.html", changefreq: "monthly", priority: "0.8" },
        { path: "/paginas/guiaAvanzada.html", changefreq: "monthly", priority: "0.8" }
    ];

    const plantPages = plants.map((plant) => ({
        path: plant.ficha.ruta,
        changefreq: "monthly",
        priority: "0.7"
    }));

    const entries = [...staticPages, ...plantPages]
        .map((entry) => `  <url>
    <loc>${ensureNoTrailingSlash(SITE_URL)}${entry.path}</loc>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`)
        .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>
`;
}

function generateRobots() {
    return `User-agent: *
Disallow:

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function generateRedirects(plants) {
    const hostRules = [
        "http://www.plantasacuaticas.com.ar/* https://plantasacuaticas.com.ar/:splat 301!",
        "http://plantasacuaticas.com.ar/* https://plantasacuaticas.com.ar/:splat 301!",
        "https://www.plantasacuaticas.com.ar/* https://plantasacuaticas.com.ar/:splat 301!"
    ];

    const plantLines = plants.flatMap((plant) => {
        const legacyNoExt = plant.ficha.legacyRuta.replace(/\.html$/, "");
        const absoluteLegacyRules = [
            `http://plantasacuaticas.com.ar${plant.ficha.legacyRuta} https://plantasacuaticas.com.ar${plant.ficha.ruta} 301!`,
            `http://plantasacuaticas.com.ar${legacyNoExt} https://plantasacuaticas.com.ar${plant.ficha.ruta} 301!`,
            `http://www.plantasacuaticas.com.ar${plant.ficha.legacyRuta} https://plantasacuaticas.com.ar${plant.ficha.ruta} 301!`,
            `http://www.plantasacuaticas.com.ar${legacyNoExt} https://plantasacuaticas.com.ar${plant.ficha.ruta} 301!`,
            `https://www.plantasacuaticas.com.ar${plant.ficha.legacyRuta} https://plantasacuaticas.com.ar${plant.ficha.ruta} 301!`,
            `https://www.plantasacuaticas.com.ar${legacyNoExt} https://plantasacuaticas.com.ar${plant.ficha.ruta} 301!`
        ];

        return [
            ...absoluteLegacyRules,
            `${plant.ficha.legacyRuta} ${plant.ficha.ruta} 301!`,
            `${legacyNoExt} ${plant.ficha.ruta} 301!`
        ];
    });

    return `${[...hostRules, ...plantLines].join("\n")}\n`;
}

function generate() {
    const sourcePlants = readJson(SOURCE_FILE, []);

    if (!sourcePlants.length) {
        throw new Error("No se encontraron plantas en data.json.");
    }

    const plants = buildDerivedPlants(sourcePlants);

    plants.forEach((plant) => {
        const canonicalPath = path.join(PLANTAS_DIR, plant.slug, "index.html");
        const legacyPath = path.join(FICHAS_DIR, plant.ficha.legacyArchivo);

        writeFile(canonicalPath, buildCanonicalFichaHtml(plant));
        writeFile(legacyPath, buildLegacyRedirectHtml(plant));
    });

    writeFile(path.join(PLANTAS_DIR, "index.html"), buildPlantsHubHtml(plants));
    writeFile(path.join(ROOT_DIR, "paginas", "tienda.html"), buildStoreHtmlContent(plants));
    writeFile(OUTPUT_FILE, serializePlants(plants));
    writeFile(SITEMAP_FILE, generateSitemap(plants));
    writeFile(ROBOTS_FILE, generateRobots());
    writeFile(REDIRECTS_FILE, generateRedirects(plants));

    console.log(`Generacion completada: ${plants.length} fichas SEO, redirectores legacy, plantas.json, sitemap, robots y _redirects actualizados.`);
}

generate();
