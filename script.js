// --- Elementos del DOM ---
const preguntaTexto = document.getElementById('pregunta-texto');
const respuestasContainer = document.getElementById('respuestas-container');
const siguienteBtn = document.getElementById('siguiente-btn');
const anteriorBtn = document.getElementById('anterior-btn');
const marcarPendienteBtn = document.getElementById('marcar-pendiente-btn');
const verPendientesBtn = document.getElementById('ver-pendientes-btn');
const finalizarBtn = document.getElementById('finalizar-btn');
const feedbackDiv = document.getElementById('feedback');
const preguntaNumeroDiv = document.getElementById('pregunta-numero');
const preguntaCodigoDiv = document.getElementById('pregunta-codigo');
const pendientesCountSpan = document.getElementById('pendientes-count');

// --- Estado de la Aplicación ---
let preguntas = [];
let preguntaActualIndex = 0;
let modoPendientes = false;
let preguntasPendientesIndices = [];

// --- Carga y Preparación de Datos ---
fetch('preguntas.json')
    .then(res => res.json())
    .then(data => {
        // Añadimos el estado inicial a cada pregunta cargada
        preguntas = data.map(q => ({
            ...q,
            respuestaUsuario: null,
            marcadaPendiente: false
        }));
        // Mezclamos las preguntas al inicio
        preguntas = preguntas.sort(() => Math.random() - 0.5);
        mostrarPregunta();
    })
    .catch(error => {
        console.error("Error al cargar las preguntas:", error);
        preguntaTexto.textContent = "Error al cargar el archivo 'preguntas.json'. Asegúrate de que el archivo existe en la misma carpeta y está bien formado.";
    });

// --- Lógica Principal ---
function mostrarPregunta() {
    if (preguntas.length === 0) return;

    // Aseguramos que el índice no se salga de los límites
    if (preguntaActualIndex < 0) preguntaActualIndex = 0;
    if (preguntaActualIndex >= preguntas.length) preguntaActualIndex = preguntas.length - 1;

    const pregunta = preguntas[preguntaActualIndex];

    // Reseteamos la interfaz
    respuestasContainer.innerHTML = '';
    feedbackDiv.textContent = '';
    
    // Actualizamos la información de la pregunta
    preguntaTexto.textContent = pregunta.pregunta;
    preguntaNumeroDiv.textContent = `Pregunta ${preguntaActualIndex + 1} / ${preguntas.length}`;
    
    // El código 'tema' es opcional. Si no existe en el JSON, ocultamos el elemento.
    if (pregunta.tema) {
        preguntaCodigoDiv.textContent = pregunta.tema;
        preguntaCodigoDiv.style.display = 'inline';
    } else {
        preguntaCodigoDiv.style.display = 'none';
    }
    
    // Actualizamos el estado visual del botón "Marcar pendiente"
    marcarPendienteBtn.classList.toggle('active', pregunta.marcadaPendiente);
    actualizarContadorPendientes();

    // Creamos los botones de respuesta
    pregunta.respuestas.forEach(respuesta => {
        const button = document.createElement('button');
        button.textContent = respuesta;
        button.classList.add('respuesta-btn');
        button.addEventListener('click', () => seleccionarRespuesta(button, respuesta, pregunta));
        respuestasContainer.appendChild(button);
        
        // Si la pregunta ya ha sido respondida, mostramos el resultado
        if (pregunta.respuestaUsuario) {
            if (respuesta === pregunta.respuestaUsuario) {
                button.classList.add('selected');
                button.classList.toggle('correcta', pregunta.respuestaUsuario === pregunta.correcta);
                button.classList.toggle('incorrecta', pregunta.respuestaUsuario !== pregunta.correcta);
            }
            if(respuesta === pregunta.correcta) {
                button.classList.add('correcta');
            }
        }
    });
    
    // Damos feedback si ya se respondió
    if (pregunta.respuestaUsuario) {
        Array.from(respuestasContainer.children).forEach(btn => btn.disabled = true);
        if (pregunta.respuestaUsuario === pregunta.correcta) {
            feedbackDiv.textContent = '✅ ¡Respuesta correcta!';
        } else {
            feedbackDiv.textContent = '❌ Respuesta incorrecta.';
        }
    }
    
    // Habilitamos/deshabilitamos los botones de navegación
    anteriorBtn.disabled = preguntaActualIndex === 0;
    siguienteBtn.disabled = preguntaActualIndex === preguntas.length - 1;
}

function seleccionarRespuesta(botonSeleccionado, respuestaSeleccionada, pregunta) {
    if (pregunta.respuestaUsuario) return; // No permitir cambiar la respuesta

    pregunta.respuestaUsuario = respuestaSeleccionada;
    mostrarPregunta(); // Volvemos a dibujar todo para reflejar el estado
}

function actualizarContadorPendientes() {
    const pendientes = preguntas.filter(p => p.marcadaPendiente).length;
    pendientesCountSpan.textContent = pendientes;
}

// --- Eventos de los Botones de Navegación ---
siguienteBtn.addEventListener('click', () => {
    if (preguntaActualIndex < preguntas.length - 1) {
        preguntaActualIndex++;
        mostrarPregunta();
    }
});

anteriorBtn.addEventListener('click', () => {
    if (preguntaActualIndex > 0) {
        preguntaActualIndex--;
        mostrarPregunta();
    }
});

marcarPendienteBtn.addEventListener('click', () => {
    preguntas[preguntaActualIndex].marcadaPendiente = !preguntas[preguntaActualIndex].marcadaPendiente;
    mostrarPregunta();
});

verPendientesBtn.addEventListener('click', () => {
    const indicesPendientes = preguntas.reduce((acc, p, i) => {
        if (p.marcadaPendiente) acc.push(i);
        return acc;
    }, []);

    if (indicesPendientes.length === 0) {
        alert("No hay preguntas marcadas como pendientes.");
        return;
    }
    
    // Aquí podrías implementar una lógica más compleja para un "modo revisión"
    // Por ahora, simplemente vamos a la primera pregunta pendiente
    preguntaActualIndex = indicesPendientes[0];
    mostrarPregunta();
});

finalizarBtn.addEventListener('click', () => {
    const respondidas = preguntas.filter(p => p.respuestaUsuario !== null).length;
    const correctas = preguntas.filter(p => p.respuestaUsuario === p.correcta).length;
    
    if (confirm(`Has respondido ${respondidas} de ${preguntas.length} preguntas.\nCorrectas: ${correctas}\n\n¿Deseas finalizar el examen?`)) {
        alert(`Examen finalizado. Tu puntuación: ${correctas} / ${preguntas.length}.`);
        // Opcional: reiniciar el examen
        location.reload();
    }
});