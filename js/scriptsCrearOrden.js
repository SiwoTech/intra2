// --- INICIO: Obtener datos de las APIs y organizarlos ---
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

// Obtener parámetros de usuario y franquicia
const franq = getParameterByName('a');
const user = getParameterByName('b');
const nivel = getParameterByName('c');
const tipo = getParameterByName('d');
const clave = getParameterByName('e');
const fult = getParameterByName('f');


// Guardar clave en window para acceso global
window.clave = clave || '';

// Opcional: mostrar en consola para depuración
console.log('Clave:', window.clave);


// Variables globales simplificadas (sin sistema de pasos)
let franquicias = [];
let afiliados = [];
let selectedServices = [];
let servicesData = [];

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
    const e = params.get('e');
    const f = params.get('f');
    if (a && b && c && d && e && f) {
        history.replaceState(null, '', `?a=${a}&b=${b}&c=${c}&d=${d}&e=${e}&f=${f}`);
    }
}

// Funciones de validación
function validateStep1() {
    const errors = [];
    
    // Obtener valores de los campos
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const pais = document.getElementById('pais').value;
    const ciudad = document.getElementById('ciudad').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    
    // Validar nombre (solo letras y espacios, mínimo 2 caracteres)
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    if (!nombre) {
        errors.push('El nombre es obligatorio');
    } else if (!nombreRegex.test(nombre)) {
        errors.push('El nombre debe contener solo letras y espacios (2-50 caracteres)');
    }
    
    // Validar teléfono (números, espacios, guiones y paréntesis, 10-15 dígitos)
    const telefonoRegex = /^[\d\s\-\(\)\+]{10,20}$/;
    if (!telefono) {
        errors.push('El teléfono es obligatorio');
    } else if (!telefonoRegex.test(telefono)) {
        errors.push('El teléfono debe contener entre 10-20 caracteres (números, espacios, guiones permitidos)');
    }
    
    // Validar correo electrónico (opcional - solo si tiene valor)
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (correo && correo.length > 0 && !correoRegex.test(correo)) {
        errors.push('El correo electrónico no tiene un formato válido');
    }
    
    // Validar país
    if (!pais) {
        errors.push('Debe seleccionar un país');
    }
    
    // Validar ciudad (solo letras, espacios y acentos, mínimo 2 caracteres)
    const ciudadRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    if (!ciudad) {
        errors.push('La ciudad es obligatoria');
    } else if (!ciudadRegex.test(ciudad)) {
        errors.push('La ciudad debe contener solo letras y espacios (2-50 caracteres)');
    }
    
    // Validar dirección (mínimo 5 caracteres)
    if (!direccion) {
        errors.push('La dirección es obligatoria');
    } else if (direccion.length < 5) {
        errors.push('La dirección debe tener al menos 5 caracteres');
    } else if (direccion.length > 100) {
        errors.push('La dirección no puede exceder 100 caracteres');
    }
    
    return errors;
}

function showValidationErrors(errors) {
    // Eliminar TODOS los errores anteriores de forma más robusta
    const existingErrors = document.querySelectorAll('.validation-errors, .error-message, .validation-popover');
    existingErrors.forEach(error => error.remove());
    
    if (errors.length > 0) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'validation-popover';
        errorContainer.innerHTML = `
            <div class="popover-arrow"></div>
            <div class="error-header">⚠️ Errores en el formulario:</div>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
            <button class="close-popover" onclick="clearValidationErrors()">×</button>
        `;
        
        // Insertar el popover al lado del formulario
        const step1Container = document.querySelector('.ContainerStep1');
        step1Container.appendChild(errorContainer);
        
        // Animar la aparición del popover
        setTimeout(() => {
            errorContainer.classList.add('show');
        }, 10);
        
        return false;
    }
    
    return true;
}

// Nueva función para limpiar errores manualmente
function clearValidationErrors() {
    const existingErrors = document.querySelectorAll('.validation-errors, .error-message, .validation-popover');
    existingErrors.forEach(error => {
        error.classList.add('hide');
        setTimeout(() => error.remove(), 300);
    });
    clearFieldErrors();
}

function clearFieldErrors() {
    // Remover clases de error de todos los campos
    const fields = ['nombre', 'telefono', 'correo', 'pais', 'ciudad', 'direccion'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove('field-error');
        }
    });
}

function highlightErrorFields() {
    // Añadir clase de error a campos vacíos o inválidos
    const nombre = document.getElementById('nombre');
    const telefono = document.getElementById('telefono');
    const correo = document.getElementById('correo');
    const pais = document.getElementById('pais');
    const ciudad = document.getElementById('ciudad');
    const direccion = document.getElementById('direccion');
    
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    const telefonoRegex = /^[\d\s\-\(\)\+]{10,20}$/;
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const ciudadRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    
    if (!nombre.value.trim() || !nombreRegex.test(nombre.value.trim())) {
        nombre.classList.add('field-error');
    }
    if (!telefono.value.trim() || !telefonoRegex.test(telefono.value.trim())) {
        telefono.classList.add('field-error');
    }
    // El correo es opcional - solo marcar error si tiene contenido pero formato inválido
    if (correo.value.trim() && !correoRegex.test(correo.value.trim())) {
        correo.classList.add('field-error');
    }
    if (!pais.value) {
        pais.classList.add('field-error');
    }
    if (!ciudad.value.trim() || !ciudadRegex.test(ciudad.value.trim())) {
        ciudad.classList.add('field-error');
    }
    if (!direccion.value.trim() || direccion.value.trim().length < 5) {
        direccion.classList.add('field-error');
    }
}

// Funciones para navegar entre pasos
function Step1() {
    // Solo hacer scroll al step 1
    document.querySelector('.ContainerStep1').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function Step2() {
    // Validar antes de avanzar
    clearValidationErrors();
    const errors = validateStep1();
    
    if (errors.length > 0) {
        highlightErrorFields();
        showValidationErrors(errors);
        return;
    }
    
    // Si no hay errores, hacer scroll al step 2
    document.querySelector('.ContainerStep2').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function Step3() {
    // Validar que haya servicios seleccionados antes de avanzar
    if (selectedServices.length === 0) {
        alert('Debe seleccionar al menos un servicio antes de continuar');
        return;
    }
    
    // Hacer scroll al step 3
    document.querySelector('.ContainerStep3').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function populateOrderSummary() {
    const infoContainer = document.querySelector('.ContainerStep3 .infoContainer');
    
    // Obtener datos del formulario del paso 1
    const cliente = document.getElementById('nombre').value;
    const telefono = document.getElementById('telefono').value;
    const correo = document.getElementById('correo').value;
    const pais = document.getElementById('pais').value;
    const ciudad = document.getElementById('ciudad').value;
    const direccion = document.getElementById('direccion').value;
    
    // Calcular total
    const total = selectedServices.reduce((sum, service) => sum + parseFloat(service.price), 0);
    
    // Crear resumen HTML
    infoContainer.innerHTML = `
        <div class="order-summary">
            <h3>Resumen de la Orden</h3>
            
            <div class="summary-section">
                <h4>Datos del Cliente:</h4>
                <p><strong>Nombre:</strong> ${cliente}</p>
                <p><strong>Teléfono:</strong> ${telefono}</p>
                <p><strong>Correo:</strong> ${correo}</p>
                <p><strong>País:</strong> ${pais}</p>
                <p><strong>Ciudad:</strong> ${ciudad}</p>
                <p><strong>Dirección:</strong> ${direccion}</p>
            </div>
            
            <div class="summary-section">
                <h4>Servicios Seleccionados:</h4>
                <ul class="services-summary">
                    ${selectedServices.map(service => 
                        `<li>${service.fullName || service.name} - $${service.price}</li>`
                    ).join('')}
                </ul>
                <p class="total-summary"><strong>Total: $${total.toFixed(2)}</strong></p>
            </div>
            
            <div class="summary-section">
                <h4>Información de la Orden:</h4>
                <p><strong>Franquicia:</strong> ${window.clave || 'No especificada'}</p>
                <p><strong>Usuario:</strong> ${user || 'No especificado'}</p>
                <p><strong>Total de servicios:</strong> ${selectedServices.length}</p>
            </div>
        </div>
    `;
}

async function submitOrder() {
    // PASO 1: Validación completa de todos los campos
    
    // Validar paso 1 (datos del cliente)
    clearValidationErrors();
    const step1Errors = validateStep1();
    
    if (step1Errors.length > 0) {
        showValidationErrors(step1Errors);
        highlightErrorFields();
        // Hacer scroll al step 1 para que el usuario corrija
        document.querySelector('.ContainerStep1').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    // Validar paso 2 (servicios)
    if (selectedServices.length === 0) {
        alert('Debe seleccionar al menos un servicio antes de enviar la orden');
        // Hacer scroll al step 2
        document.querySelector('.ContainerStep2').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    // Validar paso 3 (fechas y detalles)
    const step3Errors = validateStep3();
    if (step3Errors.length > 0) {
        alert('Por favor complete todos los campos requeridos:\n\n' + step3Errors.join('\n'));
        // Hacer scroll al step 3
        document.querySelector('.ContainerStep3').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    
    // PASO 2: Si todas las validaciones pasan, mostrar modal de confirmación
    try {
        await showConfirmationModal();
    } catch (error) {
        console.error('Error al mostrar confirmación:', error);
        alert('Error al generar la vista previa de la orden');
    }
}

// Nueva función para validar el paso 3
function validateStep3() {
    const errors = [];
    
    try {
        // Buscar directamente en el DOM sin depender del estado del paso
        const fsolicita = document.querySelector('#fsolicita') || document.querySelector('input[id="fsolicita"]');
        const fprogram = document.querySelector('#fprogram') || document.querySelector('input[id="fprogram"]');
        const hora = document.querySelector('#hora') || document.querySelector('input[id="hora"]');
        const operador = document.querySelector('#operador') || document.querySelector('select[id="operador"]');
        
        // Verificar que los campos existen en el DOM
        if (!fsolicita || !fprogram || !hora || !operador) {
            console.error('Error: No se encontraron todos los campos del paso 3');
            console.log('Elementos encontrados:');
            console.log('- fsolicita:', !!fsolicita);
            console.log('- fprogram:', !!fprogram);
            console.log('- hora:', !!hora);
            console.log('- operador:', !!operador);
            errors.push('- Error: Los campos del formulario no están disponibles. Intente refrescar la página.');
            return errors;
        }
        
        if (!fsolicita.value) {
            errors.push('- Fecha de solicitud es requerida');
        }
        
        if (!fprogram.value) {
            errors.push('- Fecha programada es requerida');
        }
        
        if (!hora.value) {
            errors.push('- Hora programada es requerida');
        }
        
        if (!operador.value || operador.value.trim() === '') {
            errors.push('- Operador es requerido');
        }
        
        return errors;
    } catch (error) {
        console.error('Error en validateStep3:', error);
        errors.push('- Error interno de validación. Intente refrescar la página.');
        return errors;
    }
}

// Nueva función para mostrar el modal de confirmación
async function showConfirmationModal() {
    console.log('🔄 Iniciando showConfirmationModal');
    
    // Esperar un tick para asegurar que el DOM esté listo
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Verificar que el modal existe antes de proceder
    const modal = document.getElementById('confirmationModal');
    if (!modal) {
        console.error('❌ No se encontró el modal de confirmación en el DOM');
        console.log('🔍 Buscando modal en el documento...');
        const allModals = document.querySelectorAll('[id*="Modal"], [id*="modal"]');
        console.log('🔍 Modales encontrados:', Array.from(allModals).map(m => m.id));
        alert('Error crítico: Modal no encontrado. Por favor recargue la página.');
        return;
    }
    
    // Verificar que los elementos del modal existen
    const nextOrderElement = document.getElementById('nextOrderNumber');
    const summaryElement = document.getElementById('confirmationOrderSummary');
    
    if (!nextOrderElement) {
        console.error('❌ No se encontró el elemento nextOrderNumber en el DOM');
        console.log('🔍 Elementos con ID similar:');
        const similarElements = document.querySelectorAll('[id*="Order"], [id*="order"], [id*="Number"], [id*="number"]');
        console.log('🔍 Elementos similares:', Array.from(similarElements).map(e => ({ id: e.id, tag: e.tagName })));
        console.log('🔍 Contenido del modal:', modal.innerHTML);
        alert('Error en la interfaz: Elemento de número de orden no encontrado. Por favor recargue la página.');
        return;
    }
    
    if (!summaryElement) {
        console.error('❌ No se encontró el elemento confirmationOrderSummary en el DOM');
        console.log('🔍 Elementos con ID similar:');
        const similarElements = document.querySelectorAll('[id*="Summary"], [id*="summary"], [id*="confirmation"], [id*="Confirmation"]');
        console.log('🔍 Elementos similares:', Array.from(similarElements).map(e => ({ id: e.id, tag: e.tagName })));
        alert('Error en la interfaz: Elemento de resumen no encontrado. Por favor recargue la página.');
        return;
    }
    
    console.log('✅ Elementos del modal verificados correctamente');
    
    // Obtener el próximo número de orden
    console.log('🔄 Obteniendo próximo número de orden...');
    const nextOrderNumber = await getNextOrderNumber();
    
    if (!nextOrderNumber) {
        console.error('❌ No se pudo obtener el número de orden');
        alert('Error al obtener el número de orden. Intente nuevamente.');
        return;
    }
    
    console.log('✅ Número de orden obtenido:', nextOrderNumber);
    
    // Verificar que el número de orden tiene el formato correcto
    const orderCode = nextOrderNumber.proximo_codigo_orden || nextOrderNumber.codigo_orden || null;
    if (!orderCode) {
        console.error('❌ Formato inesperado de respuesta del servidor:', nextOrderNumber);
        alert('Error al obtener el código de orden. Intente nuevamente.');
        return;
    }
    
    console.log('✅ Código de orden válido:', orderCode);
    
    // Actualizar el número de orden en el modal
    nextOrderElement.textContent = orderCode;
    console.log('✅ Número de orden actualizado en el DOM');
    
    // Generar el resumen de la orden
    console.log('🔄 Generando resumen de la orden...');
    const confirmationSummary = generateConfirmationSummary();
    summaryElement.innerHTML = confirmationSummary;
    console.log('✅ Resumen de orden generado');
    
    // Mostrar el modal
    modal.style.display = 'flex';
    console.log('✅ Modal mostrado correctamente');
}

// Función para obtener el próximo número de orden
async function getNextOrderNumber() {
    try {
        console.log('🔄 Solicitando próximo número de orden para franquicia:', window.clave);
        
        if (!window.clave) {
            console.error('❌ No se ha definido la clave de franquicia');
            return null;
        }
        
        const url = `${API_BASE}getNextOrderNumber.php?franchise_code=${encodeURIComponent(window.clave)}`;
        console.log('🌐 URL de solicitud:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        
        console.log('📡 Respuesta HTTP status:', response.status);
        
        if (!response.ok) {
            console.error('❌ Respuesta HTTP no exitosa:', response.status, response.statusText);
            return null;
        }
        
        const result = await response.json();
        console.log('📊 Respuesta del servidor:', result);
        
        if (result.error) {
            console.error('❌ Error del servidor:', result.error);
            return null;
        }
        
        if (!result.data) {
            console.error('❌ No se recibieron datos del servidor');
            return null;
        }
        
        console.log('✅ Datos del próximo número de orden:', result.data);
        return result.data;
    } catch (error) {
        console.error('❌ Error de conexión al obtener próximo número:', error);
        return null;
    }
}

// Función para generar el HTML del resumen de confirmación
function generateConfirmationSummary() {
    // Obtener datos del formulario - con verificación de existencia
    const cliente = document.getElementById('nombre')?.value || '';
    const telefono = document.getElementById('telefono')?.value || '';
    const correo = document.getElementById('correo')?.value || '';
    const pais = document.getElementById('pais')?.value || '';
    const ciudad = document.getElementById('ciudad')?.value || '';
    const direccion = document.getElementById('direccion')?.value || '';
    
    const fsolicita = document.getElementById('fsolicita')?.value || '';
    const fprogram = document.getElementById('fprogram')?.value || '';
    const hora = document.getElementById('hora')?.value || '';
    const operadorSelect = document.getElementById('operador');
    const operadorText = operadorSelect?.options[operadorSelect.selectedIndex]?.text || 'No seleccionado';
    const comentarios = document.getElementById('comentarios')?.value || '';
    const fuenteSelect = document.getElementById('fuente');
    const fuente = fuenteSelect && fuenteSelect.value ? fuenteSelect.value : 'web'; 
    
    // Calcular total
    const total = selectedServices.reduce((sum, service) => sum + parseFloat(service.price), 0);
    
    return `
        <div class="confirmation-summary">
            <div class="summary-section">
                <h4>📋 Datos del Cliente:</h4>
                <div class="info-grid">
                    <div class="info-item"><strong>Nombre:</strong> ${cliente}</div>
                    <div class="info-item"><strong>Teléfono:</strong> ${telefono}</div>
                    <div class="info-item"><strong>Correo:</strong> ${correo}</div>
                    <div class="info-item"><strong>País:</strong> ${pais}</div>
                    <div class="info-item"><strong>Ciudad:</strong> ${ciudad}</div>
                    <div class="info-item"><strong>Dirección:</strong> ${direccion}</div>
                </div>
            </div>
            
            <div class="summary-section">
                <h4>🛠️ Servicios Seleccionados:</h4>
                <ul class="services-list">
                    ${selectedServices.map(service => 
                        `<li>
                            <span class="service-name">${service.fullName || service.name}</span>
                            <span class="service-price">$${service.price}</span>
                        </li>`
                    ).join('')}
                </ul>
                <div class="total-amount">
                    <strong>Total: $${total.toFixed(2)}</strong>
                </div>
            </div>
            
            <div class="summary-section">
                <h4>📅 Programación:</h4>
                <div class="info-grid">
                    <div class="info-item"><strong>Fecha Solicitud:</strong> ${formatDateForDisplay(fsolicita)}</div>
                    <div class="info-item"><strong>Fecha Programada:</strong> ${formatDateForDisplay(fprogram)}</div>
                    <div class="info-item"><strong>Hora:</strong> ${hora}</div>
                    <div class="info-item"><strong>Operador:</strong> ${operadorText}</div>
                    <div class="info-item"><strong>Comentarios:</strong> ${comentarios || 'Sin comentarios'}</div>
                </div>
            </div>
            
            <div class="summary-section">
                <h4>ℹ️ Información Adicional:</h4>
                <div class="info-grid">
                    <div class="info-item"><strong>Franquicia:</strong> ${window.clave}</div>
                    <div class="info-item"><strong>Creador:</strong> ${user}</div>
                    <div class="info-item"><strong>Fuente:</strong> ${fuente. charAt(0).toUpperCase() + fuente.slice(1)}</div>
                    <div class="info-item"><strong>Total Servicios:</strong> ${selectedServices.length}</div>
                </div>
            </div>
        </div>
    `;
}

// Función para formatear fechas para mostrar
function formatDateForDisplay(dateString) {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Función para cerrar el modal de confirmación
function closeConfirmationModal() {
    document.getElementById('confirmationModal').style.display = 'none';
}

// Función para confirmar y enviar la orden (versión original de submitOrder)
async function confirmOrderSubmission() {
    // Cerrar modal
    closeConfirmationModal();
    
    // Obtener datos del formulario - con verificación
    const fsolicita = document.getElementById('fsolicita')?.value || '';
    const fprogram = document.getElementById('fprogram')?.value || '';
    const hora = document.getElementById('hora')?.value || '';
    const operador = document.getElementById('operador')?.value || '';
    const comentarios = document.getElementById('comentarios')?.value || '';
    
    const cliente = document.getElementById('nombre')?.value || '';
    const telefono = document.getElementById('telefono')?.value || '';
    const correo = document.getElementById('correo')?.value || '';
    const pais = document.getElementById('pais')?.value || '';
    const ciudad = document.getElementById('ciudad')?.value || '';
    const direccion = document.getElementById('direccion')?.value || '';
    
    const fuenteSelect = document.getElementById('fuente');
    const fuente = fuenteSelect && fuenteSelect.value ?  fuenteSelect.value : 'web';
    
    // Preparar datos para envío
    const orderData = {
        franchise_code: window.clave,
        cliente: cliente,
        correo: correo,
        telefono: telefono,
        pais: pais,
        ciudad: ciudad,
        direccion: direccion,
        fsolicita: fsolicita,
        fprogram: fprogram,
        hora: hora,
        operador: operador.trim(),
        comentarios: comentarios,
        servicios: selectedServices,
        creador: user,
        fuente: fuente 
    };
    
    try {
        // Mostrar indicador de carga
        const submitButton = document.querySelector('.btn-confirm');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Creando Orden...';
        submitButton.disabled = true;
        
        const response = await fetch(API_BASE + 'createOrder.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.error) {
            alert('Error al crear la orden: ' + result.error);
            return;
        }
        
        // Mostrar mensaje de éxito
        alert(`¡Orden creada exitosamente!
        
Detalles de la orden:
- Código de Orden: ${result.data.codigo_orden}
- Item: ${result.data.item}
- Total de servicios: ${result.data.total_servicios}

La orden ha sido registrada correctamente en el sistema.`);
        
        // Limpiar formulario y regresar a la lista de órdenes
        resetForm();
        preserveUrlParams();
        window.location.href = `selorden.html?a=${franq}&b=${user}&c=${nivel}&d=${tipo}&e=${window.clave}&f=${fult}`;
        
    } catch (error) {
        console.error('Error al enviar orden:', error);
        alert('Error de conexión al enviar la orden. Por favor intente nuevamente.');
    } finally {
        // Restaurar botón
        const submitButton = document.querySelector('.btn-confirm');
        if (submitButton) {
            submitButton.textContent = 'Confirmar y Crear Orden';
            submitButton.disabled = false;
        }
    }
}

function resetForm() {
    // Limpiar servicios seleccionados
    selectedServices = [];
    updateServicesList();
    updateTotalPrice();
    updateOrderSummary();
    
    // Limpiar campos del cliente
    document.getElementById('nombre').value = '';
    document.getElementById('telefono').value = '';
    document.getElementById('correo').value = '';
    document.getElementById('pais').value = '';
    document.getElementById('ciudad').value = '';
    document.getElementById('direccion').value = '';
    
    // Limpiar campos de programación
    document.getElementById('fsolicita').value = '';
    document.getElementById('fprogram').value = '';
    document.getElementById('hora').value = '';
    document.getElementById('operador').value = '';
    document.getElementById('comentarios').value = '';
    
    // Limpiar errores de validación
    clearFieldErrors();
    const errorContainer = document.querySelector('.validation-errors');
    if (errorContainer) {
        errorContainer.remove();
    }
}

// Inicialización cuando se carga la página
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
    
    // ==========================================
    // MOSTRAR SELECTOR DE FUENTE 
    // ==========================================
    if (user && user.toLowerCase() === 'ahernandezc') {
        const fuenteContainer = document.getElementById('fuenteContainer');
        if (fuenteContainer) {
            fuenteContainer.style.display = 'block';
            console.log('✅ Selector de fuente activado para achavez');
        }
    }
    // ==========================================
    
    
    // Preservar parámetros URL primero
    preserveUrlParams();

    document.getElementById('franqTitle').textContent = clave || 'Franquicia no especificada';
    
    // Obtener datos de franquicias
    await fetchFranchises();
    await loadServices();
    await loadOperators(); // Cargar operadores después de servicios

    // Configurar fechas mínimas y valores por defecto
    setupDateInputs();

    // Inicializar el primer paso como visible
    // Inicializar el primer paso como visible y activo
    const firstContainer = document.querySelector('.ContainerStep1');
    if (firstContainer) {
        firstContainer.classList.add('active');
        firstContainer.style.visibility = 'visible';
        firstContainer.style.opacity = '1';
    }

    // Añadir event listeners para limpiar errores al escribir
    setupFieldValidationListeners();
    
    const fsolicita = document.getElementById('fsolicita');
    if (fsolicita) {
        // Fecha de hoy según la PC
        const now = new Date();
        const formatted = now.toISOString().slice(0, 10);

        // Valor inicial
        fsolicita.value = formatted;
        // Valor mínimo permitido (no deja elegir fechas anteriores)
        fsolicita.min = formatted;

        // Opcional: Bloqueo de escritura manual, permitir solo con calendario
        fsolicita.addEventListener('keydown', function(e) {
            // Permite tabulación y flechas
            if(['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
            e.preventDefault();
        });
        fsolicita.addEventListener('paste', function(e) {
            e.preventDefault();
        });
        fsolicita.addEventListener('drop', function(e) {
            e.preventDefault();
        });
    }
    
    console.log('📋 Sistema de validación inicializado');
});

function setupDateInputs() {
    // Establecer fecha mínima como hoy
    const today = new Date().toISOString().split('T')[0];
    const fsolicita = document.getElementById('fsolicita');
    const fprogram = document.getElementById('fprogram');
    
    if (fsolicita) {
        fsolicita.min = today;
        fsolicita.value = today; // Establecer fecha de solicitud como hoy por defecto
    }
    
    if (fprogram) {
        fprogram.min = today;
    }
    
    // Establecer hora por defecto (9:00 AM)
    const hora = document.getElementById('hora');
    if (hora && !hora.value) {
        hora.value = '09:00';
    }
}

function setupFieldValidationListeners() {
    const fields = ['nombre', 'telefono', 'correo', 'pais', 'ciudad', 'direccion'];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                // Limpiar error visual del campo actual
                this.classList.remove('field-error');
                
                // Si hay mensajes de error visibles, eliminarlos después de 2 segundos de inactividad
                clearTimeout(this.errorTimeout);
                this.errorTimeout = setTimeout(() => {
                    const errorContainer = document.querySelector('.validation-errors');
                    if (errorContainer) {
                        errorContainer.style.animation = 'slideOutError 0.3s ease-in';
                        setTimeout(() => {
                            errorContainer.remove();
                        }, 300);
                    }
                }, 2000);
            });
            
            field.addEventListener('blur', function() {
                // Validación en tiempo real cuando el usuario sale del campo
                validateFieldOnBlur(fieldId);
            });
        }
    });
}

function validateFieldOnBlur(fieldId) {
    const field = document.getElementById(fieldId);
    const value = field.value.trim();
    let isValid = true;
    
    switch(fieldId) {
        case 'nombre':
            const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
            isValid = value && nombreRegex.test(value);
            break;
        case 'telefono':
            const telefonoRegex = /^[\d\s\-\(\)\+]{10,20}$/;
            isValid = value && telefonoRegex.test(value);
            break;
        case 'correo':
            const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            // El correo es opcional - solo validar si tiene contenido
            isValid = !value || correoRegex.test(value);
            break;
        case 'pais':
            isValid = !!value;
            break;
        case 'ciudad':
            const ciudadRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
            isValid = value && ciudadRegex.test(value);
            break;
        case 'direccion':
            isValid = value && value.length >= 5 && value.length <= 100;
            break;
    }
    
    if (!isValid && value) {
        field.classList.add('field-error');
    } else {
        field.classList.remove('field-error');
    }
}


// Variables globales para servicios (evitar duplicado)
// selectedServices y servicesData ya están declaradas arriba

async function fetchServices() {
    try {
        const response = await fetch(API_BASE + 'getServices.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({ franchise_code: window.clave })
        });
        const json = await response.json();
        if (json.error) {
            console.error('Error al obtener servicios:', json.error);
            return [];
        } 
        servicesData = Array.isArray(json.data) ? json.data : [];
        return servicesData;
    } catch (e) {
        console.error('Error al obtener servicios:', e);
        return [];
    }
}

async function loadServices() {
    const servicios = await fetchServices();
    const tablaServicios = document.getElementById('pricesTableBody');

    tablaServicios.style.display = servicios.length > 0 ? 'table-row-group' : 'none';
    if (servicios.length === 0) {
        // Limpiar tabla (excepto header)
        const headerRow = tablaServicios.querySelector('.classification');
        tablaServicios.innerHTML = '';
        tablaServicios.appendChild(headerRow);
        
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="text-center">No hay servicios disponibles para esta franquicia</td>';
        tablaServicios.appendChild(row);
        return;
    } else {
        // Limpiar tabla (excepto header)
        const headerRow = tablaServicios.querySelector('.classification');
        tablaServicios.innerHTML = '';
        tablaServicios.appendChild(headerRow);

        servicios.forEach((servicio, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="service-name">${servicio.nombre}</td>
                <td class="price-cell" data-type="desinfeccion" data-service="${servicio.nombre}" data-index="${index}">
                    ${createPriceCell(servicio.precio_desinfeccion, servicio.data_type, 'desinfeccion', servicio.nombre)}
                </td>
                <td class="price-cell" data-type="lavado" data-service="${servicio.nombre}" data-index="${index}">
                    ${createPriceCell(servicio.precio_lavado, servicio.data_type, 'lavado', servicio.nombre)}
                </td>
                <td class="edit-cell">
                    <button class="btn-edit" onclick="openEditPriceModal('${servicio.nombre}', ${index})" title="Editar precios">
                        ✏️
                    </button>
                </td>
            `;
            tablaServicios.appendChild(row);
        });

        // Agregar event listeners para las celdas de precio
        setupPriceCellListeners();
    }
}

// ===========================================
// FUNCIONES PARA CARGAR OPERADORES
// ===========================================

// Función para cargar operadores de la franquicia actual
async function loadOperators() {
    console.log('🔧 Cargando operadores para la franquicia:', clave);
    
    try {
        if (!clave) {
            console.error('No se ha especificado la franquicia (clave)');
            updateOperatorSelect([]);
            return;
        }

        const response = await fetch(`${API_BASE}getOperators.php?franquicia=${encodeURIComponent(clave)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Operadores cargados:', data.data.length);
            updateOperatorSelect(data.data);
        } else {
            console.error('Error del servidor:', data.message);
            updateOperatorSelect([]);
        }
        
    } catch (error) {
        console.error('Error al cargar operadores:', error);
        updateOperatorSelect([]);
    }
}

// Función para actualizar el select de operadores
function updateOperatorSelect(operators) {
    const operatorSelect = document.getElementById('operador');
    
    if (!operatorSelect) {
        console.error('No se encontró el elemento select de operadores');
        return;
    }

    // Limpiar opciones existentes
    operatorSelect.innerHTML = '';

    if (operators.length === 0) {
        operatorSelect.innerHTML = '<option value="">No hay operadores disponibles</option>';
        operatorSelect.disabled = true;
        return;
    }

    // Agregar opción por defecto
    operatorSelect.innerHTML = '<option value="">Seleccione un operador</option>';
    
    // Agregar operadores
    operators.forEach(operator => {
        const option = document.createElement('option');
        option.value = operator.id;
        option.textContent = operator.display_text;
        option.dataset.nombre = operator.nombre;
        option.dataset.afiliado = operator.afiliado;
        operatorSelect.appendChild(option);
    });

    operatorSelect.disabled = false;
    console.log('✅ Select de operadores actualizado con', operators.length, 'operadores');
}

// Función de debug para probar la carga de operadores
window.testOperatorLoad = function(franquicia = null) {
    const testFranquicia = franquicia || clave || 'PRB';
    console.log('🧪 Probando carga de operadores para franquicia:', testFranquicia);
    
    fetch(`${API_BASE}getOperators.php?franquicia=${encodeURIComponent(testFranquicia)}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('📊 Respuesta del API:', data);
        if (data.success) {
            console.log('👥 Operadores encontrados:', data.data);
            data.data.forEach((op, index) => {
                console.log(`${index + 1}. ${op.display_text}`);
            });
        }
    })
    .catch(error => {
        console.error('❌ Error en la prueba:', error);
    });
};

// Función de debug completa para el sistema de operadores
window.debugOperatorSystem = function() {
    console.log('🔧 === DEBUG SISTEMA DE OPERADORES ===');
    console.log('📍 Parámetros actuales:');
    console.log('- Franquicia (clave):', clave);
    console.log('- Usuario:', user);
    console.log('- API Base:', API_BASE);
    
    const operatorSelect = document.getElementById('operador');
    console.log('📋 Estado del select:');
    console.log('- Elemento existe:', !!operatorSelect);
    console.log('- Está deshabilitado:', operatorSelect?.disabled);
    console.log('- Número de opciones:', operatorSelect?.options.length);
    console.log('- Valor actual:', operatorSelect?.value);
    
    if (operatorSelect && operatorSelect.options.length > 0) {
        console.log('📝 Opciones disponibles:');
        Array.from(operatorSelect.options).forEach((option, index) => {
            console.log(`${index}: "${option.textContent}" (value: ${option.value})`);
        });
    }
    
    console.log('🌐 Probando conexión con API...');
    testOperatorLoad();
};

// Función de debug para probar la obtención del próximo número de orden
window.debugNextOrderNumber = function() {
    console.log('🔧 === DEBUG PRÓXIMO NÚMERO DE ORDEN ===');
    console.log('📍 Parámetros actuales:');
    console.log('- Franquicia (clave):', window.clave);
    console.log('- API Base:', API_BASE);
    console.log('- API Key:', API_KEY);
    
    // Probar la función directamente
    console.log('🧪 Probando getNextOrderNumber()...');
    getNextOrderNumber().then(result => {
        console.log('📊 Resultado:', result);
        if (result) {
            console.log('✅ Próximo código de orden:', result.proximo_codigo_orden);
            console.log('✅ Próximo número:', result.proximo_numero);
            console.log('✅ Próximo item:', result.proximo_item);
        } else {
            console.log('❌ No se pudo obtener el próximo número');
        }
    }).catch(error => {
        console.error('❌ Error en la prueba:', error);
    });
    
    // Probar la URL directamente
    const testUrl = `${API_BASE}getNextOrderNumber.php?franchise_code=${encodeURIComponent(window.clave)}`;
    console.log('🌐 URL de prueba:', testUrl);
    
    fetch(testUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-API-Key': API_KEY
        }
    })
    .then(response => {
        console.log('📡 Status HTTP:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('📊 Respuesta raw:', data);
    })
    .catch(error => {
        console.error('❌ Error en prueba directa:', error);
    });
};

// Función de debug para verificar elementos del DOM
window.debugModalElements = function() {
    console.log('🔧 === DEBUG ELEMENTOS DEL MODAL ===');
    
    const modal = document.getElementById('confirmationModal');
    console.log('📋 Modal de confirmación:');
    console.log('- Existe:', !!modal);
    console.log('- Visible:', modal?.style.display);
    
    const nextOrderElement = document.getElementById('nextOrderNumber');
    console.log('📋 Elemento nextOrderNumber:');
    console.log('- Existe:', !!nextOrderElement);
    console.log('- Contenido actual:', nextOrderElement?.textContent);
    console.log('- Clase CSS:', nextOrderElement?.className);
    
    const summaryElement = document.getElementById('confirmationOrderSummary');
    console.log('📋 Elemento confirmationOrderSummary:');
    console.log('- Existe:', !!summaryElement);
    console.log('- Tiene contenido:', !!summaryElement?.innerHTML);
    
    if (modal) {
        console.log('🔍 Contenido del modal:');
        console.log(modal.innerHTML);
    }
};

// Función de prueba completa del flujo de confirmación
window.testConfirmationFlow = function() {
    console.log('🧪 === PRUEBA COMPLETA DEL FLUJO DE CONFIRMACIÓN ===');
    
    // 1. Verificar elementos del DOM
    debugModalElements();
    
    // 2. Probar obtención del próximo número
    debugNextOrderNumber();
    
    // 3. Simular el flujo completo
    console.log('🔄 Simulando showConfirmationModal...');
    showConfirmationModal().then(() => {
        console.log('✅ showConfirmationModal completado');
    }).catch(error => {
        console.error('❌ Error en showConfirmationModal:', error);
    });
};

// Función de debug específica para el problema de modales conflictivos
window.debugModalConflict = function() {
    console.log('🔧 === DEBUG CONFLICTO DE MODALES ===');
    
    // Verificar todos los modales actualmente en el DOM
    const allModals = document.querySelectorAll('.modal-overlay');
    console.log('📊 Total de modales encontrados:', allModals.length);
    
    allModals.forEach((modal, index) => {
        console.log(`📋 Modal ${index + 1}:`);
        console.log('- ID:', modal.id || 'Sin ID');
        console.log('- Clases:', modal.className);
        console.log('- Visible:', modal.style.display !== 'none');
        console.log('- Contiene nextOrderNumber:', !!modal.querySelector('#nextOrderNumber'));
        console.log('- Contiene confirmationOrderSummary:', !!modal.querySelector('#confirmationOrderSummary'));
    });
    
    // Verificar específicamente el modal de confirmación
    const confirmationModal = document.getElementById('confirmationModal');
    console.log('🎯 Modal de confirmación específico:');
    console.log('- Existe:', !!confirmationModal);
    console.log('- Visible:', confirmationModal?.style.display);
    console.log('- nextOrderNumber existe:', !!confirmationModal?.querySelector('#nextOrderNumber'));
    console.log('- confirmationOrderSummary existe:', !!confirmationModal?.querySelector('#confirmationOrderSummary'));
    
    // Simular agregar servicio personalizado
    console.log('🧪 Simulando agregar servicio personalizado...');
    console.log('📋 Modales antes de agregar servicio:', document.querySelectorAll('.modal-overlay').length);
    
    // No ejecutar realmente, solo mostrar lo que pasaría
    console.log('🔄 Se ejecutaría addService() -> se crearía modal temporal');
    console.log('🔄 Se ejecutaría confirmCustomService() -> se cerraría modal temporal');
    console.log('🔄 Se ejecutaría showConfirmationModal() -> buscaría nextOrderNumber');
};

function createPriceCell(price, dataType, serviceType, serviceName) {
    if (price === null || price === 0 || price === '') {
        return '<span class="empty-price">-</span>';
    }

    let cellContent = `<span class="price-value">$${price}</span>`;
    
    if (dataType === 'range' && serviceType === 'lavado') {
        cellContent += '<span class="range-indicator"> (Rango)</span>';
    } else if (dataType === 'proportional') {
        cellContent += '<span class="proportional-indicator"> (Por m²)</span>';
    }

    return cellContent;
}

function setupPriceCellListeners() {
    const priceCells = document.querySelectorAll('.price-cell');
    priceCells.forEach(cell => {
        const priceSpan = cell.querySelector('.price-value');
        if (priceSpan) {
            cell.style.cursor = 'pointer';
            cell.addEventListener('click', () => handlePriceCellClick(cell));
        }
    });
}

function handlePriceCellClick(cell) {
    const serviceName = cell.dataset.service;
    const serviceType = cell.dataset.type;
    const serviceIndex = parseInt(cell.dataset.index);
    const serviceData = servicesData[serviceIndex];

    if (!serviceData) return;

    const price = serviceType === 'desinfeccion' ? serviceData.precio_desinfeccion : serviceData.precio_lavado;
    
    if (price === null || price === 0) return;

    if (serviceData.data_type === 'proportional') {
        openProportionalModal(serviceName, serviceType, price);
    } else if (serviceData.data_type === 'range' && serviceType === 'lavado') {
        openRangeModal(serviceName, serviceData.precio_lavado, serviceData.precio_lavado_alt);
    } else {
        // Tipo normal
        addServiceToList(serviceName, price, serviceType);
    }
}

function addServiceToList(serviceName, price, serviceType = '') {
    console.log('🔄 Agregando servicio a la lista:', { serviceName, price, serviceType });
    
    // Crear el nombre completo del servicio como se muestra en la lista
    let fullServiceName = serviceName;
    if (serviceType && serviceType !== '') {
        fullServiceName = `${serviceName} (${serviceType})`;
    }
    
    // Siempre agregar nuevo servicio (permitir duplicados)
    selectedServices.push({
        name: serviceName,           // Nombre base del servicio
        fullName: fullServiceName,   // Nombre completo para mostrar y guardar
        price: price,
        type: serviceType,
        id: Date.now() + Math.random() // ID único
    });

    console.log('✅ Servicio agregado. Total servicios:', selectedServices.length);
    console.log('📊 Lista actual de servicios:', selectedServices.map(s => s.fullName));

    updateServicesList();
    updateTotalPrice();
    updateOrderSummary(); // Actualizar resumen después de agregar servicio
    
    console.log('✅ Interfaz actualizada después de agregar servicio');
}

function updateServicesList() {
    const serviceList = document.getElementById('serviceList');
    
    if (selectedServices.length === 0) {
        serviceList.innerHTML = '<p class="no-services">No hay servicios seleccionados</p>';
        return;
    }
    
    serviceList.innerHTML = '';

    selectedServices.forEach((service, index) => {
        const serviceItem = document.createElement('div');
        serviceItem.className = 'service-item';
        serviceItem.innerHTML = `
            <div class="service-info">
                <span class="service-name">${service.fullName || service.name}</span>
                <span class="service-price">$${parseFloat(service.price).toFixed(2)}</span>
            </div>
            <div class="service-actions">
                <button class="btn-edit-price" onclick="editServicePrice(${index})" title="Editar precio">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                    </svg>
                </button>
                <button class="btn-remove-service" onclick="removeService(${index})" title="Eliminar servicio">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                    </svg>
                </button>
            </div>
        `;
        serviceList.appendChild(serviceItem);
    });
}

function updateTotalPrice() {
    const total = selectedServices.reduce((sum, service) => sum + parseFloat(service.price), 0);
    document.getElementById('totalPrice').textContent = total.toFixed(2);
}

function removeService(index) {
    selectedServices.splice(index, 1);
    updateServicesList();
    updateTotalPrice();
    updateOrderSummary();
}

// Nueva función para editar precio de servicio individual
function editServicePrice(index) {
    const service = selectedServices[index];
    if (!service) return;
    
    // Obtener precio base del servicio (desde servicesData)
    let basePrice = 0;
    const serviceData = servicesData.find(s => s.nombre === service.name);
    if (serviceData) {
        if (service.type === 'desinfeccion') {
            basePrice = parseFloat(serviceData.precio_desinfeccion) || 0;
        } else if (service.type === 'lavado') {
            basePrice = parseFloat(serviceData.precio_lavado) || 0;
        } else {
            // Servicio personalizado, usar precio actual como base
            basePrice = parseFloat(service.price) || 0;
        }
    } else {
        // Servicio personalizado
        basePrice = parseFloat(service.price) || 0;
    }
    
    const currentPrice = parseFloat(service.price);
    const newPrice = prompt(
        `Editar precio para: ${service.fullName || service.name}\n\n` +
        `Precio base: $${basePrice.toFixed(2)}\n` +
        `Precio actual: $${currentPrice.toFixed(2)}\n\n` +
        `Ingrese el nuevo precio (no puede ser menor al precio base):`,
        currentPrice.toFixed(2)
    );
    
    if (newPrice === null) return; // Usuario canceló
    
    const parsedPrice = parseFloat(newPrice);
    
    if (isNaN(parsedPrice)) {
        alert('Por favor ingrese un precio válido.');
        return;
    }
    
    if (parsedPrice < basePrice) {
        alert(`El precio no puede ser menor al precio base de $${basePrice.toFixed(2)}`);
        return;
    }
    
    // Actualizar precio del servicio
    selectedServices[index].price = parsedPrice.toFixed(2);
    
    // Actualizar interfaz
    updateServicesList();
    updateTotalPrice();
    updateOrderSummary();
    
    console.log(`Precio actualizado para ${service.name}: $${parsedPrice.toFixed(2)}`);
}

// Función para limpiar todos los servicios
function clearAllServices() {
    if (selectedServices.length === 0) return;
    
    if (confirm('¿Está seguro de que desea eliminar todos los servicios seleccionados?')) {
        selectedServices = [];
        updateServicesList();
        updateTotalPrice();
        updateOrderSummary();
    }
}

// Nueva función para agregar servicios personalizados
function addCustomService() {
    const serviceName = prompt('Ingrese el nombre del servicio personalizado:');
    if (!serviceName || serviceName.trim() === '') return;
    
    const servicePrice = prompt('Ingrese el precio del servicio:');
    if (!servicePrice) return;
    
    const parsedPrice = parseFloat(servicePrice);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
        alert('Por favor ingrese un precio válido mayor a 0.');
        return;
    }
    
    addServiceToList(serviceName.trim(), parsedPrice.toFixed(2), 'personalizado');
}

function restoreServices() {
    clearAllServices();
}

// Modal para servicios proporcionales
function openProportionalModal(serviceName, serviceType, pricePerM2) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Cálculo por área - ${serviceName}</h3>
            <p>Precio por m²: $${pricePerM2}</p>
            <div class="form-group">
                <label for="area">Área en m²:</label>
                <input type="number" id="area" min="1" step="0.1" placeholder="Ingrese el área">
            </div>
            <div class="modal-result">
                <strong>Total: $<span id="modalTotal">0.00</span></strong>
            </div>
            <div class="modal-buttons">
                <button class="btn-cancel" onclick="closeCustomServiceModal()">Cancelar</button>
                <button class="btn-confirm" onclick="confirmProportionalService('${serviceName}', '${serviceType}', ${pricePerM2})">Agregar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Event listener para calcular en tiempo real
    const areaInput = document.getElementById('area');
    areaInput.addEventListener('input', () => {
        const area = parseFloat(areaInput.value) || 0;
        const total = area * pricePerM2;
        document.getElementById('modalTotal').textContent = total.toFixed(2);
    });

    areaInput.focus();
}

function confirmProportionalService(serviceName, serviceType, pricePerM2) {
    const area = parseFloat(document.getElementById('area').value);
    
    if (!area || area <= 0) {
        alert('Por favor ingrese un área válida');
        return;
    }

    const totalPrice = area * pricePerM2;
    const serviceNameWithArea = `${serviceName} (${area}m²)`;
    
    addServiceToList(serviceNameWithArea, totalPrice, serviceType);
    closeCustomServiceModal();
}

// Modal para servicios de rango
function openRangeModal(serviceName, priceMin, priceMax) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Seleccionar rango de precio - ${serviceName}</h3>
            <p>Seleccione el precio según las condiciones del servicio:</p>
            <div class="range-options">
                <button class="btn-range" onclick="confirmRangeService('${serviceName}', ${priceMin}, 'Estándar')">
                    Estándar: $${priceMin}
                </button>
                <button class="btn-range" onclick="confirmRangeService('${serviceName}', ${priceMax}, 'Premium')">
                    Premium: $${priceMax}
                </button>
            </div>
            <div class="modal-buttons">
                <button class="btn-cancel" onclick="closeCustomServiceModal()">Cancelar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

function confirmRangeService(serviceName, price, rangeType) {
    const serviceNameWithRange = `${serviceName} (${rangeType})`;
    addServiceToList(serviceNameWithRange, price, 'lavado');
    closeCustomServiceModal();
}

// Modal para agregar servicios personalizados
function addService() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay custom-service-modal'; // Clase adicional para identificar
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Agregar Servicio Personalizado</h3>
            <div class="form-group">
                <label for="customServiceName">Nombre del servicio:</label>
                <input type="text" id="customServiceName" placeholder="Ingrese el nombre del servicio">
            </div>
            <div class="form-group">
                <label for="customServicePrice">Precio:</label>
                <input type="number" id="customServicePrice" min="1" step="0.01" placeholder="Ingrese el precio">
            </div>
            <div class="form-group">
                <label for="customServiceType">Tipo:</label>
                <select id="customServiceType">
                    <option value="lavado">Lavado</option>
                    <option value="desinfeccion">Desinfección</option>
                    <option value="ventas">Ventas</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button class="btn-cancel" onclick="closeCustomServiceModal()">Cerrar</button>
                <button class="btn-confirm" onclick="confirmCustomService()">Agregar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.getElementById('customServiceName').focus();
}

function confirmCustomService() {
    const name = document.getElementById('customServiceName').value.trim();
    const price = parseFloat(document.getElementById('customServicePrice').value);
    const type = document.getElementById('customServiceType').value;

    if (!name) {
        alert('Por favor ingrese el nombre del servicio');
        return;
    }

    if (!price || price <= 0) {
        alert('Por favor ingrese un precio válido');
        return;
    }

    addServiceToList(name, price, type);
    closeCustomServiceModal(); // Usar la función específica
}

// Modal para editar precios
function openEditPriceModal(serviceName, serviceIndex) {
    const serviceData = servicesData[serviceIndex];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            <h3>Editar Precios - ${serviceName}</h3>
            <p><strong>Tipo de servicio:</strong> ${serviceData.data_type}</p>
            
            <div class="form-group">
                <label for="editPriceDesinfeccion">Precio Desinfección:</label>
                <input type="number" id="editPriceDesinfeccion" step="0.01" 
                       value="${serviceData.precio_desinfeccion || ''}" 
                       placeholder="Precio base de desinfección">
            </div>
            
            <div class="form-group">
                <label for="editPriceLavado">Precio Lavado:</label>
                <input type="number" id="editPriceLavado" step="0.01" 
                       value="${serviceData.precio_lavado || ''}" 
                       placeholder="Precio base de lavado">
            </div>
            
            ${serviceData.data_type === 'range' ? `
            <div class="form-group">
                <label for="editPriceLavadoAlt">Precio Lavado Premium:</label>
                <input type="number" id="editPriceLavadoAlt" step="0.01" 
                       value="${serviceData.precio_lavado_alt || ''}" 
                       placeholder="Precio premium de lavado">
            </div>
            ` : ''}
            
            <div class="modal-buttons">
                <button class="btn-cancel" onclick="closeModal()">Cancelar</button>
                <button class="btn-confirm" onclick="confirmEditPrice('${serviceName}', ${serviceIndex})">Guardar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
}

async function confirmEditPrice(serviceName, serviceIndex) {
    const priceDesinfeccion = parseFloat(document.getElementById('editPriceDesinfeccion').value) || null;
    const priceLavado = parseFloat(document.getElementById('editPriceLavado').value) || null;
    const priceLavadoAlt = document.getElementById('editPriceLavadoAlt') ? 
                           parseFloat(document.getElementById('editPriceLavadoAlt').value) || null : null;

    try {
        const response = await fetch(API_BASE + 'updateFranchisePrice.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                franchise_code: window.clave,
                nombre_servicio: serviceName,
                precio_desinfeccion: priceDesinfeccion,
                precio_lavado: priceLavado,
                precio_lavado_alt: priceLavadoAlt,
                data_type: servicesData[serviceIndex].data_type
            })
        });

        const result = await response.json();
        
        if (result.error) {
            alert('Error: ' + result.error);
            return;
        }

        // Actualizar datos locales
        servicesData[serviceIndex].precio_desinfeccion = priceDesinfeccion;
        servicesData[serviceIndex].precio_lavado = priceLavado;
        if (priceLavadoAlt !== null) {
            servicesData[serviceIndex].precio_lavado_alt = priceLavadoAlt;
        }

        // Recargar tabla
        await loadServices();
        closeModal();
        
        alert('Precios actualizados correctamente');
    } catch (error) {
        console.error('Error al actualizar precios:', error);
        alert('Error al actualizar precios');
    }
}

function closeModal() {
    // Esta función cierra cualquier modal dinámico (NO el modal de confirmación de orden)
    const dynamicModals = document.querySelectorAll('.modal-overlay:not(#confirmationModal)');
    dynamicModals.forEach(modal => modal.remove());
}

function closeCustomServiceModal() {
    // Función específica para cerrar modales de servicios personalizados
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        // Solo eliminar si NO es el modal de confirmación
        if (!modal.id || modal.id !== 'confirmationModal') {
            modal.remove();
        }
    });
}

// Función para actualizar el resumen de la orden 
function updateOrderSummary() {
    // Esta función ahora solo se mantiene para compatibilidad
    // El resumen se muestra solo en el modal de confirmación
}
// ================================
// FUNCIÓN PARA BUSCAR CLIENTE POR TELÉFONO
// ================================

async function searchClientByPhone() {
    const telefono = document.getElementById('telefono').value.trim();
    
    if (!telefono) {
        alert('Por favor ingresa un número de teléfono para buscar');
        return;
    }
    
    // Mostrar indicador de carga en el botón
    const searchBtn = event.target. closest('.btn-search-client');
    const originalContent = searchBtn.innerHTML;
    searchBtn.disabled = true;
    searchBtn.innerHTML = `
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16" style="animation: spin 1s linear infinite;">
            <path d="M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3zM1.5 8a6.5 6.5 0 1 1 13 0A6.5 6.5 0 0 1 1.5 8z"/>
        </svg>
        Buscando...
    `;
    
    try {
        console.log('Buscando cliente con teléfono:', telefono);
        
        // Llamar al API para buscar cliente
        const response = await fetch(`${API_BASE}searchClientByPhone.php?telefono=${encodeURIComponent(telefono)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            // Cliente encontrado, llenar los campos
            const cliente = data.data;
            
            document.getElementById('nombre').value = cliente.cliente || '';
            document.getElementById('correo').value = cliente.correo || '';
            document.getElementById('pais').value = cliente.pais || '';
            document.getElementById('ciudad').value = cliente.ciudad || '';
            document.getElementById('direccion').value = cliente.direccion || '';
            
            // Mostrar mensaje de éxito
            alert(`✅ Cliente encontrado: ${cliente.cliente}\nDatos cargados automáticamente. `);
            
            console.log('Cliente encontrado y datos cargados:', cliente);
        } else {
            // Cliente no encontrado
            alert('ℹ️ No se encontró un cliente con este teléfono.\nPuedes continuar ingresando los datos manualmente.');
            console.log('Cliente no encontrado para teléfono:', telefono);
        }
        
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        alert('❌ Error al buscar el cliente. Por favor intenta de nuevo.');
    } finally {
        // Restaurar botón
        searchBtn.disabled = false;
        searchBtn.innerHTML = originalContent;
    }
}

// Agregar animación de spin para el ícono de carga
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);