// --- Elementos del DOM ---
const startContainer = document.getElementById('start-container');
const quizContainer = document.getElementById('quiz-container');
const quizFooter = document.getElementById('quiz-footer'); // <-- Añadido
const startRepasoBtn = document.getElementById('start-repaso-btn');
const startExamenBtn = document.getElementById('start-examen-btn');

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
let todasLasPreguntas = [];
let preguntas = [];
let preguntaActualIndex = 0;
let modoPendientes = false;

// --- Carga y Preparación de Datos ---
fetch('preguntas.json')
    .then(res => res.json())
    .then(data => {
        todasLasPreguntas = data;
    })
    .catch(error => {
        console.error("Error al cargar las preguntas:", error);
        startContainer.innerHTML = `<h1>Error al cargar el archivo 'preguntas.json'</h1><p>Asegúrate de que el archivo existe y está bien formado.</p>`;
    });

// --- Lógica de Inicio del Juego ---
function startGame(mode) {
    let preguntasOriginales = [...todasLasPreguntas];
    let preguntasMezcladas = preguntasOriginales.sort(() => Math.random() - 0.5);

    if (mode === 'examen') {
        preguntas = preguntasMezcladas.slice(0, 40);
    } else {
        preguntas = preguntasMezcladas;
    }

    preguntas = preguntas.map(q => ({
        ...q,
        respuestaUsuario: null,
        marcadaPendiente: false
    }));

    preguntaActualIndex = 0;
    startContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    quizFooter.classList.remove('hidden'); // <-- Añadido: Muestra el footer

    mostrarPregunta();
}

// --- Lógica Principal del Examen ---
function mostrarPregunta() {
    if (preguntas.length === 0) return;

    if (preguntaActualIndex < 0) preguntaActualIndex = 0;
    if (preguntaActualIndex >= preguntas.length) preguntaActualIndex = preguntas.length - 1;

    const pregunta = preguntas[preguntaActualIndex];

    respuestasContainer.innerHTML = '';
    feedbackDiv.textContent = '';
    
    preguntaTexto.textContent = pregunta.pregunta;
    preguntaNumeroDiv.textContent = `Pregunta ${preguntaActualIndex + 1} / ${preguntas.length}`;
    
    if (pregunta.tema) {
        preguntaCodigoDiv.textContent = pregunta.tema;
        preguntaCodigoDiv.style.display = 'inline';
    } else {
        preguntaCodigoDiv.style.display = 'none';
    }
    
    marcarPendienteBtn.classList.toggle('active', pregunta.marcadaPendiente);
    actualizarContadorPendientes();

    pregunta.respuestas.forEach(respuesta => {
        const button = document.createElement('button');
        button.textContent = respuesta;
        button.classList.add('respuesta-btn');
        button.addEventListener('click', () => seleccionarRespuesta(button, respuesta, pregunta));
        respuestasContainer.appendChild(button);
        
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
    
    if (pregunta.respuestaUsuario) {
        Array.from(respuestasContainer.children).forEach(btn => btn.disabled = true);
        if (pregunta.respuestaUsuario === pregunta.correcta) {
            feedbackDiv.textContent = '✅ ¡Respuesta correcta!';
        } else {
            feedbackDiv.textContent = '❌ Respuesta incorrecta.';
        }
    }
    
    anteriorBtn.disabled = preguntaActualIndex === 0;
    siguienteBtn.disabled = preguntaActualIndex === preguntas.length - 1;
}

function seleccionarRespuesta(botonSeleccionado, respuestaSeleccionada, pregunta) {
    if (pregunta.respuestaUsuario) return;

    pregunta.respuestaUsuario = respuestaSeleccionada;
    mostrarPregunta();
}

function actualizarContadorPendientes() {
    const pendientes = preguntas.filter(p => p.marcadaPendiente).length;
    pendientesCountSpan.textContent = pendientes;
}

// --- Eventos de los Botones ---
startRepasoBtn.addEventListener('click', () => startGame('repaso'));
startExamenBtn.addEventListener('click', () => startGame('examen'));

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
    
    preguntaActualIndex = indicesPendientes[0];
    mostrarPregunta();
});

finalizarBtn.addEventListener('click', () => {
    const respondidas = preguntas.filter(p => p.respuestaUsuario !== null).length;
    const correctas = preguntas.filter(p => p.respuestaUsuario === p.correcta).length;
    
    if (confirm(`Has respondido ${respondidas} de ${preguntas.length} preguntas.\nCorrectas: ${correctas}\n\n¿Deseas finalizar y volver al inicio?`)) {
        location.reload();
    }
});