const misProductos = "../data.json";
let productos = [];

const getProductosAsync = async () => {
    try {
        const response = await fetch(misProductos);
        productos = await response.json();
        mostrarProductos(productos);
    } catch (error) {
        Swal.fire({
            position: "center",
            icon: "success",
            title: `Se produjo un error: ${error}`,
            showConfirmButton: !1,
            timer: 1500
        });
    }
};

window.addEventListener("DOMContentLoaded", () => {
    getProductosAsync();
});

const mostrarProductos = (items) => {
    const contenedor = document.getElementById("tienda__grid");

    items.forEach((item) => {
        const card = document.createElement("div");
        card.classList.add("tienda__grid__card");
        card.innerHTML += `<h3 class="tienda__grid__card__titulo">Nombre: ${item.nombre}</h3>
        <p class="tienda__grid__card__parrafo">${item.descripcion}</p>
        <a class="tienda__grid__card__comprar comprar" href="${item.link || "#"}" aria-label="Comprar ${item.nombre}">Comprar</a>
        <div class="position">
            <p class="tienda__grid__card__parrafo cantidadoculta-carrito posicion" id="compro${item.id}">cantidad: </p>
            <a class="tienda__grid__card__link" href="${item.ficha}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ficha técnica de ${item.nombre}">
                <span class="tienda__grid__card__overlay">
                    <span class="tienda__grid__card__overlay-title">Ficha técnica</span>
                    <span class="tienda__grid__card__overlay-text">Hacé clic en la foto para abrirla</span>
                </span>
                <img class="tienda__grid__card__img" src="${item.img}" alt="${item.nombre}">
            </a>
        </div>`;

        contenedor.appendChild(card);
    });
};
