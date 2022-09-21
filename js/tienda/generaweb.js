
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
        <p class="boton-comprar" id=boton${producto.id}>Comprar<a href=""></a></p>`

        contenedorProductos.appendChild(div);

        const boton = document.getElementById( `boton${producto.id}` );
        boton.addEventListener('click', ()=> {
            alert(`Se agrego el producto ${producto.nombre}`);
            noDuplicarCarrito(producto.id);
        });

    });

}

mostrarProductos(productos);