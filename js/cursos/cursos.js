const misCursos="../datacursos.json";let cursos=[];const getCursosAsync=async()=>{try{let s=await fetch("../datacursos.json");cursos=await s.json(),mostrarCursos(cursos)}catch(r){}};window.addEventListener("DOMContentLoaded",()=>{getCursosAsync()});const mostrarCursos=s=>{let r=document.getElementById("curso");s.forEach(s=>{let o=document.createElement("div");o.classList.add("cursos__grilla__card"),o.innerHTML+=`<h3 class="cursos__grilla__card-titulo">${s.titulo}</h3> 
        <p class="cursos__grilla__card-parrafo">${s.descripcion}</p>            
        ${s.video}`,r.appendChild(o)})};