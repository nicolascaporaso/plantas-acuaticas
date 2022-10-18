const modalContendor = document.querySelector(".modal-container")
const abrirCarrito = document.getElementById("open")
const cerrarCarrito = document.getElementById("cerrar")
const modalCarrito = document.querySelector(".modal-carrito")
const vaciarCarro = document.getElementById('borrar');
const compra = document.getElementById('comprar');

abrirCarrito.addEventListener("click", () => {
    if (carritoDeCompras.length != "0") {
        modalContendor.classList.toggle("modal-active");
        sumaTotal();
    } else {
        Swal.fire({
            position: 'center',
            icon: 'info',
            title: `TU CARRITO AUN ESTA VACIO`,
            showConfirmButton: false,
            timer: 2500
        });
    }
})

compra.addEventListener('click', () => {
    pagar();
});

cerrarCarrito.addEventListener("click", () => {
    modalContendor.classList.remove("modal-active");
})

modalContendor.addEventListener("click", () => {
    cerrarCarrito.click();
})

modalCarrito.addEventListener("click", (e) => {
    e.stopPropagation();
})

vaciarCarro.addEventListener('click', () => {
    vaciar();
});