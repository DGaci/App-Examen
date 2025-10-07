// --- Elementos del DOM ---
const startContainer = document.getElementById('start-container');
const quizContainer = document.getElementById('quiz-container');
const quizFooter = document.getElementById('quiz-footer');
const statsContainer = document.getElementById('stats-container'); // <-- Nuevo
const startRepasoBtn = document.getElementById('start-repaso-btn');
const startExamenBtn = document.getElementById('start-examen-btn');
const startErroresBtn = document.getElementById('start-errores-btn');
const verStatsBtn = document.getElementById('ver-stats-btn'); // <-- Nuevo
const volverMenuBtn = document.getElementById('volver-menu-btn'); // <-- Nuevo
const userNameSpan = document.getElementById('user-name');

const preguntaTexto = document.getElementById('pregunta-texto');
const respuestasContainer = document.getElementById('respuestas-container');
const siguienteBtn = document.getElementById('siguiente-btn');
const anteriorBtn = document.getElementById('anterior-btn');
const marcarPendienteBtn = document.getElementById('marcar-pendiente-btn');
const verPendientesBtn = document.getElementById('ver-pendientes-btn');
const finalizarBtn = document.getElementById('finalizar-btn');
const feedbackDiv = document.getElementById('feedback');
const preguntaNumeroDiv = document.getElementById('pregunta-numero');
const pendientesCountSpan = document.getElementById('pendientes-count');

// --- Estado de la Aplicación ---
let todasLasPreguntas = [];
let preguntas = [];
let preguntaActualIndex = 0;
let modoPendientes = false;
let usuario = '';
let totalPreguntasUnicas = 0;

// =================================================================
// === GESTIÓN DE USUARIO Y PROGRESO CON LOCALSTORAGE ===
// =================================================================
function gestionarUsuario() {
    // ... (igual que antes)
    const usuarioGuardado = localStorage.getItem('quizAppUser');
    if (usuarioGuardado) { usuario = usuarioGuardado; }
    else {
        while (!usuario || usuario.trim() === '') {
            usuario = prompt("¡Bienvenido! Por favor, introduce tu nombre para guardar tu progreso:");
        }
        localStorage.setItem('quizAppUser', usuario);
        alert("Tu progreso se guardará localmente en este navegador.");
    }
    const progressKey = `quizAppProgress_${usuario}`;
    if (!localStorage.getItem(progressKey)) {
        // MEJORA: Ahora guardamos un objeto más completo
        localStorage.setItem(progressKey, JSON.stringify({ respuestas: {} }));
    }
    userNameSpan.textContent = usuario;
}

// MEJORA: Guarda si una pregunta fue correcta o incorrecta
function guardarRespuesta(pregunta, esCorrecta) {
    const progressKey = `quizAppProgress_${usuario}`;
    let progreso = JSON.parse(localStorage.getItem(progressKey));
    const idPregunta = pregunta.pregunta;
    progreso.respuestas[idPregunta] = esCorrecta ? 'correcta' : 'incorrecta';
    localStorage.setItem(progressKey, JSON.stringify(progreso));
}

function cargarProgreso() {
    const progressKey = `quizAppProgress_${usuario}`;
    return JSON.parse(localStorage.getItem(progressKey)) || { respuestas: {} };
}

// --- Lógica de la Pantalla de Estadísticas ---
function mostrarEstadisticas() {
    startContainer.classList.add('hidden');
    statsContainer.classList.remove('hidden');

    const progreso = cargarProgreso();
    const respuestas = progreso.respuestas;
    const totalRespondidas = Object.keys(respuestas).length;
    const totalCorrectas = Object.values(respuestas).filter(r => r === 'correcta').length;
    const totalIncorrectas = totalRespondidas - totalCorrectas;
    const porcentaje = totalRespondidas > 0 ? ((totalCorrectas / totalRespondidas) * 100).toFixed(1) : 0;

    document.getElementById('stats-respondidas').textContent = `${totalRespondidas} / ${todasLasPreguntas.length}`;
    document.getElementById('stats-porcentaje').textContent = `${porcentaje}%`;

    const listaErrores = document.getElementById('stats-lista-errores');
    listaErrores.innerHTML = ''; // Limpiar lista
    if (totalIncorrectas > 0) {
        Object.entries(respuestas).forEach(([pregunta, resultado]) => {
            if (resultado === 'incorrecta') {
                const li = document.createElement('li');
                li.textContent = pregunta;
                listaErrores.appendChild(li);
            }
        });
    } else {
        listaErrores.innerHTML = '<li>¡Felicidades, no tienes errores registrados!</li>';
    }
}

function volverAlMenu() {
    statsContainer.classList.add('hidden');
    startContainer.classList.remove('hidden');
}

// --- Carga y Preparación de Datos ---
fetch('preguntas.json')
    .then(res => res.json())
    .then(data => {
        todasLasPreguntas = data;
        gestionarUsuario();
    })
    .catch(error => { /* ... (igual que antes) */ });

// --- Lógica de Inicio del Juego ---
function startGame(mode) {
    // ... (lógica casi igual, solo cambia cómo carga los errores)
    document.body.classList.add('quiz-activo');
    let preguntasOriginales = [...todasLasPreguntas];
    let preguntasParaJuego = [];
    const progreso = cargarProgreso();
    const errores = Object.entries(progreso.respuestas)
                        .filter(([p, r]) => r === 'incorrecta')
                        .map(([p, r]) => p);

    if (mode === 'repaso') { /* ... (igual que antes) */ }
    else if (mode === 'examen') { /* ... (igual que antes) */ }
    else if (mode === 'errores') {
        if (errores.length === 0) {
            alert("¡Felicidades! No tienes errores guardados para repasar.");
            document.body.classList.remove('quiz-activo');
            return;
        }
        totalPreguntasUnicas = errores.length;
        errores.forEach(textoPreguntaError => {
            const preguntaError = todasLasPreguntas.find(p => p.pregunta === textoPreguntaError);
            if (preguntaError) { preguntasParaJuego.push(preguntaError); }
        });
        preguntas = preguntasParaJuego.sort(() => Math.random() - 0.5);
    }
    
    // El resto de la función startGame es igual...
    if (mode === 'repaso') {
        totalPreguntasUnicas = todasLasPreguntas.length;
        preguntasParaJuego = [...preguntasOriginales];
        const pesoExtra = 4;
        errores.forEach(textoPreguntaError => {
            const preguntaError = todasLasPreguntas.find(p => p.pregunta === textoPreguntaError);
            if (preguntaError) {
                for (let i = 0; i < pesoExtra; i++) { preguntasParaJuego.push(preguntaError); }
            }
        });
        preguntas = preguntasParaJuego.sort(() => Math.random() - 0.5);
    } else if (mode !== 'errores') {
        totalPreguntasUnicas = 40;
        preguntas = preguntasOriginales.sort(() => Math.random() - 0.5).slice(0, 40);
    }

    preguntas = preguntas.map(q => ({ ...q, respuestaUsuario: null, marcadaPendiente: false }));
    preguntaActualIndex = 0;
    startContainer.classList.add('hidden');
    quizContainer.classList.remove('hidden');
    quizFooter.classList.remove('hidden');
    mostrarPregunta();
}

// --- Lógica Principal del Examen ---
function mostrarPregunta() { /* ... (igual que antes) */ }
// MODIFICADO: Ahora guarda todas las respuestas
function seleccionarRespuesta(botonSeleccionado, respuestaSeleccionada, pregunta) {
    if (pregunta.respuestaUsuario) return;
    pregunta.respuestaUsuario = respuestaSeleccionada;
    const esCorrecta = respuestaSeleccionada === pregunta.correcta;
    guardarRespuesta(pregunta, esCorrecta); // Guardamos el resultado
    mostrarPregunta();
}
function actualizarContadorPendientes() { /* ... (igual que antes) */ }

// --- Eventos de los Botones ---
startRepasoBtn.addEventListener('click', () => startGame('repaso'));
startExamenBtn.addEventListener('click', () => startGame('examen'));
startErroresBtn.addEventListener('click', () => startGame('errores'));
verStatsBtn.addEventListener('click', mostrarEstadisticas); // <-- Nuevo
volverMenuBtn.addEventListener('click', volverAlMenu); // <-- Nuevo

siguienteBtn.addEventListener('click', () => { /* ... (igual que antes) */ });
anteriorBtn.addEventListener('click', () => { /* ... (igual que antes) */ });
marcarPendienteBtn.addEventListener('click', () => { /* ... (igual que antes) */ });
verPendientesBtn.addEventListener('click', () => { /* ... (igual que antes) */ });
finalizarBtn.addEventListener('click', () => { /* ... (igual que antes) */ });

// Pego las funciones que no cambian para que tengas el archivo completo
function mostrarPregunta() {
    if (preguntas.length === 0) return;
    if (preguntaActualIndex < 0) preguntaActualIndex = 0;
    if (preguntaActualIndex >= preguntas.length) preguntaActualIndex = preguntas.length - 1;
    const pregunta = preguntas[preguntaActualIndex];
    respuestasContainer.innerHTML = '';
    feedbackDiv.textContent = '';
    preguntaTexto.textContent = pregunta.pregunta;
    preguntaNumeroDiv.textContent = `Pregunta ${preguntaActualIndex + 1} / ${totalPreguntasUnicas}`;
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
function actualizarContadorPendientes() {
    const pendientes = preguntas.filter(p => p.marcadaPendiente).length;
    pendientesCountSpan.textContent = pendientes;
}
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
    if (confirm(`Has respondido ${respondidas} de ${totalPreguntasUnicas} preguntas.\nCorrectas: ${correctas}\n\n¿Deseas finalizar y volver al inicio?`)) {
        location.reload();
    }
});