const tabla = document.getElementById('tablaActividades');
const totalActividades = document.getElementById('totalActividades');
const totalConflictos = document.getElementById('totalConflictos');

async function cargarActividades() {

    try {

        // TOKEN TEMPORAL
        const token = localStorage.getItem('token');

        const response = await fetch('/api/actividades', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.js
        on();

        tabla.innerHTML = '';

        totalActividades.textContent = data.total;

        let conflictos = 0;

        data.actividades.forEach(act => {

            let estado = 'Correcto';
            let clase = 'active';

            if (act.dificultad >= 4) {

                estado = 'Conflicto';
                clase = 'danger-status';
                conflictos++;
                mostrarConflicto(
                    `La actividad "${act.titulo}" presenta alta dificultad o posible conflicto académico.`
                );
                mostrarToast(
                    `Conflicto detectado en ${act.materia}`,
                    'warning'
                );
            }

            const fila = `
                <tr>

                    <td>${act.materia}</td>

                    <td>${act.fecha}</td>

                    <td>${act.hora || 'Sin hora'}</td>

                    <td>
                        <span class="status ${clase}">
                            ${estado}
                        </span>
                    </td>

                </tr>
            `;

            tabla.innerHTML += fila;

        });

        totalConflictos.textContent = conflictos;

    } catch (error) {

        console.error(error);

    }

}

cargarActividades();
const form = document.getElementById('actividadForm');

form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const token = localStorage.getItem('token');

    const actividad = {

        titulo: document.getElementById('titulo').value,

        materia: document.getElementById('materia').value,

        tipo: document.getElementById('tipo').value,

        fecha: document.getElementById('fecha').value,

        hora: document.getElementById('hora').value,

        dificultad: document.getElementById('dificultad').value

    };

    try {

        const response = await fetch('/api/actividades', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },

            body: JSON.stringify(actividad)

        });

        const data = await response.json();

        if(response.ok){

           mostrarToast('Actividad creada correctamente', 'success');

            form.reset();

            cargarActividades();

        }else{

            mostrarToast(data.error, 'error');
        }

    } catch (error) {

        console.error(error);

    }


});
async function cargarResumenSemana() {

    try {

        const token = localStorage.getItem('token');

        const response = await fetch('/api/actividades/semana', {

            headers: {
                'Authorization': `Bearer ${token}`
            }

        });

        const data = await response.json();

        const contenedor = document.getElementById('resumenSemana');

        contenedor.innerHTML = `

            <div class="resumen-item">
                <p>Total actividades</p>
                <h2>${data.total || 0}</h2>
            </div>

            <div class="resumen-item">
                <p>Completadas</p>
                <h2>${data.completadas || 0}</h2>
            </div>

            <div class="resumen-item">
                <p>Pendientes</p>
                <h2>${data.pendientes || 0}</h2>
            </div>

            <div class="resumen-item">
                <p>Conflictos</p>
                <h2>${data.conflictos || 0}</h2>
            </div>

        `;

    } catch (error) {

        console.error(error);

    }

}

cargarResumenSemana();
const usuario = JSON.parse(localStorage.getItem('usuario'));

if(usuario){

    document.getElementById('saludoUsuario').textContent =
        `Hola ${usuario.nombre}`;

}
async function cargarAlertas() {

    try {

        const token = localStorage.getItem('token');

        const response = await fetch('/api/alertas', {

            headers: {
                'Authorization': `Bearer ${token}`
            }

        });

        const data = await response.json();

        const contenedor = document.getElementById('contenedorAlertas');

        contenedor.innerHTML = '';

        if(data.alertas.length === 0){

            contenedor.innerHTML = `
                <p>No tienes alertas activas</p>
            `;

            return;
        }

        data.alertas.forEach(alerta => {

            let clase = 'media';

            if(alerta.tipo === 'critica'){
                clase = 'alta';
            }

            if(alerta.tipo === 'leve'){
                clase = 'baja';
            }

            const card = document.createElement('div');

            card.classList.add('alerta');
            card.classList.add(clase);

            card.innerHTML = `

                <div class="alerta-info">

                    <h3>${alerta.titulo || 'Alerta académica'}</h3>

                    <p>${alerta.mensaje}</p>

                </div>

                ${
                    !alerta.leida
                    ?
                    `<button onclick="marcarLeida(${alerta.id})">
                        Marcar leída
                    </button>`
                    :
                    `<span>Leída</span>`
                }

            `;

            contenedor.appendChild(card);

        });

    } catch (error) {

        console.error(error);

    }

}

async function marcarLeida(id){

    try {

        const token = localStorage.getItem('token');

        await fetch(`/api/alertas/${id}/leer`, {

            method:'PATCH',

            headers:{
                'Authorization': `Bearer ${token}`
            }

        });

        cargarAlertas();

    } catch (error) {

        console.error(error);

    }

}

document.getElementById('leerTodasBtn')
.addEventListener('click', async () => {

    try {

        const token = localStorage.getItem('token');

        await fetch('/api/alertas/leer-todas', {

            method:'PATCH',

            headers:{
                'Authorization': `Bearer ${token}`
            }

        });

        cargarAlertas();

    } catch (error) {

        console.error(error);

    }

});

cargarAlertas();
async function cargarCalendario() {

    try {

        const token = localStorage.getItem('token');

        const response = await fetch('/api/actividades', {

            headers:{
                'Authorization': `Bearer ${token}`
            }

        });

        const data = await response.json();

        const calendar = document.getElementById('calendarGrid');

        calendar.innerHTML = '';

        for(let i = 1; i <= 30; i++){

            const day = document.createElement('div');

            day.classList.add('day');

            day.innerHTML = `
                <h3>${i}</h3>
            `;

            const actividadesDia = data.actividades.filter(act => {

                const fecha = new Date(act.fecha);

                return fecha.getDate() === i;

            });

            actividadesDia.forEach(act => {

                const actividad = document.createElement('div');

                actividad.classList.add('activity-item');

                if(act.dificultad >= 4){
                    actividad.classList.add('conflict');
                }

                actividad.innerHTML = `
                    ${act.materia}
                `;

                day.appendChild(actividad);

            });

            calendar.appendChild(day);

        }

    } catch (error) {

        console.error(error);

    }

}

cargarCalendario();
const modal = document.getElementById('modalConflicto');

const mensajeModal = document.getElementById('mensajeConflicto');

const cerrarModal = document.getElementById('cerrarModal');

function mostrarConflicto(mensaje){

    mensajeModal.textContent = mensaje;

    modal.style.display = 'flex';

}

cerrarModal.addEventListener('click', () => {

    modal.style.display = 'none';

});
function mostrarToast(mensaje, tipo = 'info') {

    const container = document.getElementById('toastContainer');

    const toast = document.createElement('div');

    toast.classList.add('toast');
    toast.classList.add(tipo);

    toast.textContent = mensaje;

    container.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 4000);

}
async function cargarGrafica() {

    try {

        const token = localStorage.getItem('token');

        const response = await fetch('/api/actividades', {

            headers:{
                'Authorization': `Bearer ${token}`
            }

        });

        const data = await response.json();

        let completadas = 0;
        let pendientes = 0;
        let conflictos = 0;

        data.actividades.forEach(act => {

            if(act.completada){
                completadas++;
            }else{
                pendientes++;
            }

            if(act.dificultad >= 4){
                conflictos++;
            }

        });

        const ctx = document
            .getElementById('graficaActividades')
            .getContext('2d');

        new Chart(ctx, {

            type:'doughnut',

            data:{

                labels:[
                    'Completadas',
                    'Pendientes',
                    'Conflictos'
                ],

                datasets:[{

                    data:[
                        completadas,
                        pendientes,
                        conflictos
                    ],

                    backgroundColor:[
                        '#22c55e',
                        '#3b82f6',
                        '#ef4444'
                    ],

                    borderWidth:0

                }]

            },

            options:{

                responsive:true,

                plugins:{
                    legend:{
                        position:'bottom'
                    }
                }

            }

        });

    } catch (error) {

        console.error(error);

    }

}

cargarGrafica();
document.getElementById('logoutBtn')
.addEventListener('click', () => {

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    window.location.href = '/';

});