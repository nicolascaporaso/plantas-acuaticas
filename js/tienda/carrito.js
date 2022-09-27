let carritoDeCompras = []

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('carritoDeCompras')){
        carritoDeCompras = JSON.parse(localStorage.getItem('carritoDeCompras'));
        console.log(carritoDeCompras);
        llenarCarrito(carritoDeCompras);
        }
});

const carritoIndex = (productoId)=>{

    const contenedorCarrito = document.getElementById("carrito-contenedor");

    const llenarProductosCarrito = ()=> {
        let producto  = productos.find( producto => producto.id == productoId );
        carritoDeCompras.push(producto);
        console.log(carritoDeCompras);

        producto.cantidad = 1

        let div = document.createElement("div")
        div.classList.add("productoEnCarrito")

        div.innerHTML = `<p>${producto.nombre}</p>
                        <p>Precio: ${producto.precio}</p> 
                        <p id="cantidad${producto.id}">Cantidad: ${producto.cantidad}</p>
                        <button id="eliminar${producto.id}" class="boton-eliminar" ><i class="fa-solid fa-trash-can"></i></button>`;
        contenedorCarrito.appendChild(div)
    }

    llenarProductosCarrito()
}

//vaciar carrito totalmente
let vaciar = () =>{
    carritoDeCompras.splice(0,carritoDeCompras.length);
    console.log(carritoDeCompras);
    //guardamos en Local Storage el Carrito
    localStorage.setItem('carritoDeCompras',JSON.stringify(carritoDeCompras));
    location.reload();
}

// funcion para modificar la cantidad de productos en el carrito
const poneCantCarrito = (idProducto,cantidad)=>{
    let idCantidad = document.getElementById(`cantidad${idProducto}`);
    idCantidad.innerHTML = `<p id="cantidad${idProducto}">Cantidad: ${cantidad}</p>`;

    let enCarri = document.getElementById(`compro${idProducto}`);
    enCarri.classList.remove('cantidadoculta-carrito');
    enCarri.innerHTML =`${cantidad}`;
}

//funcion para traer el carrito del local storage
const llenarCarrito = (carrito) =>{
    const contenedorCarrito = document.getElementById("carrito-contenedor");
    console.log();
    carrito.forEach(producto => {
        let div = document.createElement("div")
        div.classList.add("productoEnCarrito")
        div.classList.add(`Carrito${producto.id}`)
        div.innerHTML = `<p>${producto.nombre}</p>
        <p>Precio: ${producto.precio}</p> 
        <p id="cantidad${producto.id}">Cantidad: ${producto.cantidad}</p>
        <button id="eliminar${producto.id}" class="boton-eliminar" ><i class="fa-solid fa-trash-can"></i></button>`;
        contenedorCarrito.appendChild(div);

})
};

//funcion para que no se dupliquen items en el array
let noDuplicarCarrito = (idCantidad) =>{
    let item = carritoDeCompras.findIndex((product) => product.id === idCantidad)
    if (item == -1){
        //no existe
        carritoIndex(idCantidad);
    }else{
        //sumar a cantidades
        carritoDeCompras[item].cantidad =  carritoDeCompras[item].cantidad + 1;
        let cantCarr = carritoDeCompras[item].cantidad 
        poneCantCarrito(idCantidad,cantCarr);
    }
    //guardamos en Local Storage el Carrito
    localStorage.setItem('carritoDeCompras',JSON.stringify(carritoDeCompras));
}


let borraItem = () => {
const collection = document.getElementsByClassName("boton-eliminar");
for (let i = 0; i < collection.length; i++) {
    let botonBorrar = document.getElementById(collection[i].id);
    collection[i].style.backgroundColor = "red";
    botonBorrar.addEventListener('click', ()=> {
        let numero = collection[i].id
        numero = numero.slice(8); 
        let item = carritoDeCompras.findIndex((product) => product.id === parseInt(numero));
        carritoDeCompras.splice(item,1);
        console.log(carritoDeCompras);
        localStorage.setItem('carritoDeCompras',JSON.stringify(carritoDeCompras));
        location.reload();
    });
}
}
