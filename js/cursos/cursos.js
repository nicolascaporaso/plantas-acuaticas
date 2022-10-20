const misCursos = ('../datacursos.json');
let cursos = [];


//funcion asincronica para traer datos del data json
const getCursosAsync = async () => {
    try {
        const trae = await fetch(misCursos)
        cursos = await trae.json()
        mostrarCursos(cursos);
    } catch (error) {
    }
}

window.addEventListener('DOMContentLoaded', () => {
    getCursosAsync();
});

//genera listado de cursos
const mostrarCursos = (curso) => {
    const cardCursos = document.getElementById("curso");
    curso.forEach(cur => {
        const div = document.createElement("div");
        div.classList.add("cursos__grilla__card");
        div.innerHTML += `<h3 class="cursos__grilla__card-titulo">${cur.titulo}</h3> 
        <p class="cursos__grilla__card-parrafo">${cur.descripcion}</p>            
        ${cur.video}`
        cardCursos.appendChild(div);
    });
}

