

const btn = document.getElementById('envio_formulario');

document.getElementById('form')
.addEventListener('submit', function(event) {
event.preventDefault();

envio_formulario.value = 'Enviando...';

const serviceID = 'service_miw8f0g';
const templateID = 'template_g50ajmg';

emailjs.sendForm(serviceID, templateID, this)
    .then(() => {
    envio_formulario.value = 'Enviado';
    Swal.fire({
        position: 'center',
        icon: 'success',
        title: "Gracias, en breve nos pondremos en contacto con usted.",
        showConfirmButton: false,
        timer: 1500
        });
    }, (err) => {
    envio_formulario.value = 'Error';
    Swal.fire({
        position: 'center',
        icon: 'success',
        title: "hubo un error al intentar enviar el formulario",
        showConfirmButton: false,
        timer: 1500
        });
    });
});




// const enviarFormulario = document.getElementById("envio_formulario");

// enviarFormulario.addEventListener("click", ()=>{

//     let nombre = document.getElementById("campo-nombre");
//     let correo = document.getElementById("campo-mail");
//     let telefono = document.getElementById("telefono");
//     let newsletter = document.getElementById("newsletter"); 
//     let pais = document.getElementById("campo-pais");
//     let consulta = document.getElementById("consulta");

    
    






