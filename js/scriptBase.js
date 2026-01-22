function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

var franq = getParameterByName('a');
var user = getParameterByName('b');
var nivel = getParameterByName('c');
var tipo = getParameterByName('d');

// --- INICIO: Obtener datos de las APIs y organizarlos ---
const API_KEY = 'orange-2025';
const API_BASE = 'https://siwo-net.com/intra2-new/api/';

// Arreglos globales para guardar los datos
let franquicias = [];
let afiliados = [];

// Obtener franquicias
async function fetchFranchises() {
    try {
        const response = await fetch(API_BASE + 'getFranchises.php', {
            method: 'GET',
            headers: { 'X-API-Key': API_KEY }
        });
        const json = await response.json();
        franquicias = Array.isArray(json.data) ? json.data : [];
        // Organizar datos
        window.afiliadosId = afiliados.map(a => a.id);
        window.afiliadosClave = afiliados.map(a => a.clave);
        window.afiliadosNombre = afiliados.map(a => a.nombre);
        window.afiliadosCiudad = afiliados.map(a => a.ciudad);
        window.afiliadosCelular = afiliados.map(a => a.celular);
        window.afiliadosCorreo = afiliados.map(a => a.correo);
        window.afiliadosFultimo = afiliados.map(a => a.fultimo);
    } catch (e) {
        console.error('Error al obtener franquicias:', e);
    }
}

// Función para mantener los parámetros de URL
function preserveUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const a = params.get('a');
    const b = params.get('b');
    const c = params.get('c');
    const d = params.get('d');
    if (a && b && c && d) {
        history.replaceState(null, '', `?a=${a}&b=${b}&c=${c}&d=${d}`);
    }
}

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    // Actualizar header con datos
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const fecha = new Date();
    const textoFecha = dias[fecha.getDay()].charAt(0).toUpperCase() + dias[fecha.getDay()].slice(1) + " " + fecha.getDate() + " de " + meses[fecha.getMonth()];
    
    if (document.getElementById('fecha')) document.getElementById('fecha').textContent = textoFecha;
    if (document.getElementById('franq')) document.getElementById('franq').textContent = franq || '';
    if (document.getElementById('user')) document.getElementById('user').textContent = user || '';
    if (document.getElementById('cat')) document.getElementById('cat').textContent = (nivel ? nivel : '') + (tipo ? ' ' + tipo : '');

    // Obtener datos de franquicias
    await fetchFranchises();
    preserveUrlParams();
});