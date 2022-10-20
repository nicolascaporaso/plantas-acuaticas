
const misProductos = ('../data.json');
let productos = [];

//funcion asincronica para traer datos del data json
const getProductosAsync = async () => {
    try {
        const trae = await fetch(misProductos)
        productos = await trae.json()
        mostrarProductos(productos);
        cargaDataStorage();
    } catch (error) {
        Swal.fire({
            position: 'center',
            icon: 'success',
            title: `se produjo un error ${error}`,
            showConfirmButton: false,
            timer: 1500
        });
    }
}


window.addEventListener('DOMContentLoaded', () => {
getProductosAsync();
});

//genera listado de productos en tienda html
const mostrarProductos = (productos) => {
    const contenedorProductos = document.getElementById("tienda__grid");

    productos.forEach(producto => {
        const div = document.createElement("div");
        div.classList.add("tienda__grid__card");
        div.innerHTML += `<h3 class="tienda__grid__card__titulo">Nombre: ${producto.nombre}</h3>
        <p class="tienda__grid__card__parrafo">${producto.descripcion}</p>            
        <p class="tienda__grid__card__parrafo">Precio: $${producto.precio}</p>
        <div class="position"><p class="tienda__grid__card__parrafo cantidadoculta-carrito posicion" id="compro${producto.id}">cantidad: </p>
        <img class="tienda__grid__card__img" src="${producto.img}" alt="planta acuatica"></div>
        <p class="boton-comprar" id=boton${producto.id}>Agregar<a href=""></a></p>`

        contenedorProductos.appendChild(div);

        const boton = document.getElementById(`boton${producto.id}`);
        boton.addEventListener('click', () => {
            Swal.fire({
                position: 'center',
                icon: 'success',
                title: `Se agrego el producto ${producto.nombre}`,
                showConfirmButton: false,
                timer: 1500
            });
            noDuplicarCarrito(producto.id);
        });
    });
}
