const misProductos = ('../data.json');
let productos = [];

// Función asincrónica para traer datos del archivo JSON
const getProductosAsync = async () => {
    try {
        const trae = await fetch(misProductos);
        productos = await trae.json();
        mostrarProductos(productos);
    } catch (error) {
        Swal.fire({
            position: 'center',
            icon: 'success',
            title: `Se produjo un error: ${error}`,
            showConfirmButton: false,
            timer: 1500
        });
    }
}

// Se ejecuta cuando el contenido del DOM ha sido cargado
window.addEventListener('DOMContentLoaded', () => {
    getProductosAsync();
});

// Genera listado de productos en tienda HTML
const mostrarProductos = (productos) => {
    const contenedorProductos = document.getElementById("tienda__grid");

    productos.forEach(producto => {
        const div = document.createElement("div");
        div.classList.add("tienda__grid__card");
        div.innerHTML += `<h3 class="tienda__grid__card__titulo">Nombre: ${producto.nombre}</h3>
        <p class="tienda__grid__card__parrafo">${producto.descripcion}</p>            
        <div class="position"><p class="tienda__grid__card__parrafo cantidadoculta-carrito posicion" id="compro${producto.id}">cantidad: </p>
        <img class="tienda__grid__card__img" src="${producto.img}" alt="planta acuatica"></div>`

        contenedorProductos.appendChild(div);

    });
}