let carritoDeCompras = [];

//carga de datos del local storage
const cargaDataStorage = () => {
    if (localStorage.getItem('carritoDeCompras')) {
        carritoDeCompras = JSON.parse(localStorage.getItem('carritoDeCompras'));
        llenarCarrito(carritoDeCompras);
        //este if detecta si vacio el carrito
        if (carritoDeCompras.length == "0") {
            Swal.fire({
                position: 'center',
                icon: 'info',
                title: `En tu visita anterior no finalizaste tu compra, Animate, nuestras plantas son las mejores de la web.`,
                showConfirmButton: false,
                timer: 3000
            });
        } else {
            Swal.fire({
                position: 'center',
                icon: 'info',
                title: `Continue con su compra, Tiene plantas en su carrito`,
                showConfirmButton: false,
                timer: 1500
            });
        }
    }
}

//llenado de modal con productos agregados por usuario
const carritoIndex = (productoId) => {
    const contenedorCarrito = document.getElementById("carrito-contenedor");

    const llenarProductosCarrito = () => {
        let producto = productos.find(producto => producto.id == productoId);
        carritoDeCompras.push(producto);
        producto.cantidad = 1;
        let div = document.createElement("div")
        div.classList.add("productoEnCarrito")

        div.innerHTML = `<p>${producto.nombre}</p>
                        <p>Precio: ${producto.precio}</p> 
                        <p id="cantidad${producto.id}">Cantidad: ${producto.cantidad}</p>
                        <button id="eliminar${producto.id}" class="boton-eliminar" ><i class="fa-solid fa-trash-can"></i></button>`;
        contenedorCarrito.appendChild(div)

        borraItem(producto.id);
        poneCantCarrito(producto.id, producto.cantidad);
    }
    llenarProductosCarrito()
}

//vaciar carrito totalmente
let vaciar = () => {
    carritoDeCompras.splice(0, carritoDeCompras.length);
    //guardamos en Local Storage el Carrito
    localStorage.setItem('carritoDeCompras', JSON.stringify(carritoDeCompras));
    location.reload();
    localStorage.clear();
}

// funcion para modificar la cantidad mostrada de productos en el carrito.
const poneCantCarrito = (idProducto, cantidad) => {
    let idCantidad = document.getElementById(`cantidad${idProducto}`);
    idCantidad.innerHTML = `<p id="cantidad${idProducto}">Cantidad: ${cantidad}</p>`;

    let enCarri = document.getElementById(`compro${idProducto}`);
    enCarri.classList.remove('cantidadoculta-carrito');
    enCarri.innerHTML = `${cantidad}`;
}

//funcion para traer el carrito del local storage
const llenarCarrito = (carrito) => {
    const contenedorCarrito = document.getElementById("carrito-contenedor");
    carrito.forEach(producto => {
        let div = document.createElement("div")
        div.classList.add("productoEnCarrito")
        div.classList.add(`Carrito${producto.id}`)
        div.innerHTML = `<p>${producto.nombre}</p>
        <p>Precio: ${producto.precio}</p> 
        <p id="cantidad${producto.id}">Cantidad: ${producto.cantidad}</p>
        <button id="eliminar${producto.id}" class="boton-eliminar" ><i class="fa-solid fa-trash-can"></i></button>`;
        contenedorCarrito.appendChild(div);
        borraItem(producto.id);
        poneCantCarrito(producto.id, producto.cantidad);
    })
};

//funcion para que no se dupliquen items en el array
let noDuplicarCarrito = (idCantidad) => {
    let item = carritoDeCompras.findIndex((product) => product.id === idCantidad)
    if (item == -1) {
        //no existe
        carritoIndex(idCantidad);
    } else {
        //sumar a cantidades
        carritoDeCompras[item].cantidad = carritoDeCompras[item].cantidad + 1;
        let cantCarr = carritoDeCompras[item].cantidad
        poneCantCarrito(idCantidad, cantCarr);
    }
    //guardamos en Local Storage el Carrito
    localStorage.setItem('carritoDeCompras', JSON.stringify(carritoDeCompras));
}

//suma todos los items del carrito y los pone en pantalla
const sumaTotal = () => {
    let sumaTodo = 0;
    carritoDeCompras.forEach(producto => {
        sumaTodo = sumaTodo + (producto.precio * producto.cantidad);
    });
    let content = document.getElementById("total");
    content.textContent = `Total a pagar $${sumaTodo}`
    content.append();
}

//borra de a un item cuando se preciona el boton eliminar
const borraItem = (item) => {
    let botonBorrar = document.getElementById(`eliminar${item}`);
    botonBorrar.addEventListener('click', () => {
        let borraX = botonBorrar.parentNode
        borraX.parentNode.removeChild(borraX);
        let enCarri = document.getElementById(`compro${item}`);
        enCarri.classList.add('cantidadoculta-carrito');
        item = carritoDeCompras.findIndex((product) => product.id === item);
        carritoDeCompras.splice(item, 1);
        localStorage.setItem('carritoDeCompras', JSON.stringify(carritoDeCompras));
        sumaTotal();
    });
}

//simulacion de compra y derivacion a pasarela de pago
const pagar = () => {
    Swal.fire({
        position: 'center',
        icon: 'info',
        title: `Redirigiendo a pasarela de pago.`,
        showConfirmButton: false,
        timer: 5500
    });
    setTimeout(function () {
        vaciar();
    }, 5600);
}