
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


let nombre = document.getElementById("nombre");
let telefono = document.getElementById("telefono");
let consulta = document.getElementById("consulta");
let mail = document.getElementById("mail");

nombre.addEventListener('blur', (event) => {
    nombre.value !="" ? nombre.style.backgroundColor = "green": nombre.style.backgroundColor = "red";
    campo = event.target;
    nombregx =/[^0-9-.%+]{1,12}/;
    (nombregx.test(campo.value)) ? nombre.style.backgroundColor = "green": nombre.style.backgroundColor = "red";
});

mail.addEventListener('blur', (event) => {
    campo = event.target;
    emailRegex = /^[-\w.%+]{1,64}@(?:[A-Z0-9-]{1,63}\.){1,125}[A-Z]{2,63}$/i;
    //condicion ternaria si no es mail valido
    (emailRegex.test(campo.value)) ? mail.style.backgroundColor = "green": mail.style.backgroundColor = "red";
});

telefono.addEventListener('blur', (event) => {
    campo = event.target; 
    telRegex =/\d\d\d-\d\d-\d\d\d\d-\d\d\d\d\b/;
    (telRegex.test(campo.value)) ? telefono.style.backgroundColor = "green": telefono.style.backgroundColor = "red";
});
