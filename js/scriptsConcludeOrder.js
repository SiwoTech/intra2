// --- VARIABLES GLOBALES ---
const API_KEY = 'orange-2025';
const API_BASE = 'https://siwo-net.com/intra2-new/api/';

// Función para obtener parámetros de la URL
function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

// Obtener parámetros de URL
const orderId = getParameterByName('id');
const franq = getParameterByName('a');
const user = getParameterByName('b');
const nivel = getParameterByName('c');
const tipo = getParameterByName('d');
const clave = getParameterByName('e');
const fult = getParameterByName('f');

let currentOrder = null;

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

    // Verificar que tenemos un ID de orden
    if (!orderId) {
        showError('No se proporcionó un ID de orden válido');
        return;
    }

    // Cargar datos de la orden
    await loadOrderData();
    
    // Configurar el formulario
    setupForm();
});

// Cargar datos de la orden desde el API
async function loadOrderData() {
    try {
        const response = await fetch(`${API_BASE}getOrders.php?franquicia=${clave}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        const data = await response.json();

        if (data.data) {
            // Buscar la orden específica por ID
            currentOrder = data.data.find(order => order.id == orderId);
            
            if (currentOrder) {
                displayOrderPreview();
                populateForm();
            } else {
                showError('No se encontró la orden especificada');
            }
        } else {
            showError('Error al cargar los datos de la orden');
        }
    } catch (error) {
        console.error('Error al cargar la orden:', error);
        showError('Error de conexión al cargar los datos');
    }
}

// Mostrar vista previa de la orden
function displayOrderPreview() {
    if (!currentOrder) return;

    const orderDetailsContainer = document.getElementById('orderDetails');
    orderDetailsContainer.innerHTML = `
        <div class="order-info-grid">
            <div class="order-info-item">
                <label>Orden:</label>
                <span>${currentOrder.orden}</span>
            </div>
            <div class="order-info-item">
                <label>Item:</label>
                <span>${currentOrder.item}</span>
            </div>
            <div class="order-info-item">
                <label>SubOrden:</label>
                <span>${currentOrder.suborden}</span>
            </div>
            <div class="order-info-item">
                <label>Cliente:</label>
                <span>${currentOrder.cliente}</span>
            </div>
            <div class="order-info-item">
                <label>Teléfono:</label>
                <span>${currentOrder.telefono}</span>
            </div>
            <div class="order-info-item">
                <label>Ciudad:</label>
                <span>${currentOrder.ciudad}</span>
            </div>
            <div class="order-info-item">
                <label>Servicio:</label>
                <span>${currentOrder.servicio}</span>
            </div>
            <div class="order-info-item">
                <label>Precio:</label>
                <span>${formatCurrency(currentOrder.precio)}</span>
            </div>
            <div class="order-info-item">
                <label>Fecha Solicitada:</label>
                <span>${formatDate(currentOrder.fsolicita)}</span>
            </div>
            <div class="order-info-item">
                <label>Fecha Programada:</label>
                <span>${formatDate(currentOrder.fprogram)}</span>
            </div>
            <div class="order-info-item">
                <label>Promotor:</label>
                <span>${currentOrder.creador}</span>
            </div>
            <div class="order-info-item">
                <label>Registro:</label>
                <span>${formatDate(currentOrder.fechareg)}</span>
            </div>
        </div>
    `;
}

// Poblar formulario con datos existentes
function populateForm() {
    if (!currentOrder) return;
    
    // Establecer nombre de quien recibe (por defecto el cliente)
    document.getElementById('nombreRecibe').value = currentOrder.cliente || '';
    
    // El operador se establecerá después de cargar la lista de operadores
}

// Configurar eventos del formulario
function setupForm() {
    const form = document.getElementById('concludeForm');
    form.addEventListener('submit', handleSubmit);
    
    // Cargar operadores
    loadOperators();
}

// Cargar operadores desde el API
async function loadOperators() {
    try {
        const response = await fetch(`${API_BASE}getOperators.php?franquicia=${clave}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        const data = await response.json();

        if (data.success && data.data) {
            const operatorSelect = document.getElementById('operador');
            operatorSelect.innerHTML = '<option value="">Seleccione un operador</option>';
            
            data.data.forEach(operator => {
                const option = document.createElement('option');
                option.value = operator.id;
                option.textContent = operator.display_text;
                operatorSelect.appendChild(option);
            });
            
            // Preseleccionar el operador actual de la orden si existe
            if (currentOrder && currentOrder.operador) {
                operatorSelect.value = currentOrder.operador;
            }
        } else {
            console.error('Error al cargar operadores:', data.message || 'Respuesta inválida');
        }
    } catch (error) {
        console.error('Error al cargar operadores:', error);
    }
}

// Manejar envío del formulario
async function handleSubmit(event) {
    event.preventDefault();
    
    const operador = document.getElementById('operador').value.trim();
    const nombreRecibe = document.getElementById('nombreRecibe').value.trim();
    
    // Validaciones
    if (!operador) {
        showError('El campo operador es obligatorio');
        return;
    }
    
    if (!nombreRecibe) {
        showError('El nombre de quien recibe es obligatorio');
        return;
    }

    // Confirmar acción
    if (!confirm('¿Está seguro de que desea marcar esta orden como concluida? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        // Preparar datos para envío
        const now = new Date();
        const fconclu = now.getFullYear() + '-' + 
                       String(now.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(now.getDate()).padStart(2, '0') + ' ' + 
                       String(now.getHours()).padStart(2, '0') + ':' + 
                       String(now.getMinutes()).padStart(2, '0') + ':' + 
                       String(now.getSeconds()).padStart(2, '0');

        const updateData = {
            id: orderId,
            operador: operador,
            nombreRecibe: nombreRecibe,
            fconclu: fconclu,
            concluida: 1
        };

        // Enviar actualización al API
        const response = await fetch(API_BASE + 'concludeOrder.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(updateData)
        });

        const result = await response.json();

        if (result.success) {
            alert('Orden marcada como concluida exitosamente');
            // Regresar a la lista de órdenes
            window.location.href = `selorden.html?a=${window.clave}&b=${user}&c=${nivel}&d=${tipo}&e=${window.clave}&f=${fult}`;

        } else {
            alert((result.message || 'Error desconocido'));
            window.location.href = `selorden.html?a=${window.clave}&b=${user}&c=${nivel}&d=${tipo}&e=${window.clave}&f=${fult}`;

        }

    } catch (error) {
        console.error('Error al concluir orden:', error);
        showError('Error de conexión al procesar la solicitud');
    }
}

// Función para regresar a la lista de órdenes
function goBack() {
    window.location.href = `selorden.html?a=${franq}&b=${user}&c=${nivel}&d=${tipo}&e=${clave}&f=${fult}`;
}

// Función para mostrar errores
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

// Función para formatear fechas
function formatDate(dateString) {
    if (!dateString || 
        dateString === null || 
        dateString === '' || 
        dateString === '0000-00-00' || 
        dateString === '0000-00-00 00:00:00') {
        return 'No especificada';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-MX');
}

// Función para formatear moneda
function formatCurrency(amount) {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
}
