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

// Variables para manejo de datos
let currentOrder = null;
let originalOrderData = null;
let selectedServices = [];
let servicesData = [];

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async function() {
    // Actualizar header con datos (misma lógica que scriptBase.js)
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

    // Cargar datos iniciales
    await Promise.all([
        loadOrderData(),
        fetchServices(),
        loadOperators()
    ]);
    
    // Configurar la página
    setupPage();
});

// Cargar datos de la orden desde el API
async function loadOrderData() {
    try {
                const response = await fetch(`${API_BASE}getOrderDetails.php?id=${orderId}&franquicia=${clave}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data) {
            currentOrder = data.data;
            originalOrderData = JSON.parse(JSON.stringify(data.data)); // Copia para restaurar
            console.log('Orden cargada:', currentOrder);
            return true;
        } else {
            showError(data.message || 'No se pudo cargar la orden');
            return false;
        }
    } catch (error) {
        console.error('Error al cargar la orden:', error);
        showError('Error de conexión al cargar los datos: ' + error.message);
        return false;
    }
}

// Obtener servicios desde el API
async function fetchServices() {
    try {
        const response = await fetch(`${API_BASE}getServices.php?franchise_code=${clave}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY 
            }
        });
        const json = await response.json();
        
        if (json.success && Array.isArray(json.data)) {
            servicesData = json.data;
            console.log('Servicios cargados:', servicesData);
            return true;
        } else {
            console.error('Error en respuesta de servicios:', json);
            servicesData = [];
            return false;
        }
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        servicesData = [];
        return false;
    }
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
            if (operatorSelect) {
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
            }
        } else {
            console.error('Error al cargar operadores:', data.message || 'Respuesta inválida');
        }
    } catch (error) {
        console.error('Error al cargar operadores:', error);
    }
}

// Configurar la página
function setupPage() {
    if (!currentOrder) return;

    // Mostrar información básica de la orden
    displayOrderInfo();
    
    // Poblar formulario con datos actuales
    populateForm();
    
    // Cargar servicios en la tabla
    loadServicesTable();
    
    // Inicializar servicios seleccionados con los actuales
    initializeCurrentServices();
    
    // Configurar listeners
    setupFormListeners();
}

// Mostrar información básica de la orden
function displayOrderInfo() {
    document.getElementById('orderNumber').textContent = currentOrder.orden || 'N/A';
    document.getElementById('orderItem').textContent = currentOrder.item || 'N/A';
    document.getElementById('orderSubOrder').textContent = currentOrder.suborden || 'N/A';
    
    // Determinar estado basado en fconclu
    const status = currentOrder.fconclu ? 'Concluida' : 'Pendiente';
    document.getElementById('orderStatus').textContent = status;
}

// Poblar formulario con datos actuales
function populateForm() {
    // Datos del cliente
    document.getElementById('nombre').value = currentOrder.cliente || '';
    document.getElementById('telefono').value = currentOrder.telefono || '';
    document.getElementById('correo').value = currentOrder.correo || '';
    document.getElementById('pais').value = currentOrder.pais || '';
    document.getElementById('ciudad').value = currentOrder.ciudad || '';
    document.getElementById('direccion').value = currentOrder.direccion || '';
    
    // Fechas y detalles
    document.getElementById('fsolicita').value = formatDateForInput(currentOrder.fsolicita);
    document.getElementById('fprogram').value = formatDateForInput(currentOrder.fprogram);
    document.getElementById('hora').value = currentOrder.hprogram || '';
    document.getElementById('comentarios').value = currentOrder.comenta || '';
    
    // El operador se establecerá después de cargar la lista de operadores
}

// Inicializar servicios actuales
function initializeCurrentServices() {
    // Parsear servicios y precios actuales
    const currentServicio = currentOrder.servicio || '';
    const currentPrecio = parseFloat(currentOrder.precio) || 0;
    
    if (currentServicio) {
        // Si hay un servicio actual, agregarlo a la lista
        selectedServices = [{
            name: currentServicio,
            price: currentPrecio,
            type: 'actual'
        }];
        
        updateServicesList();
        updateTotalPrice();
    }
    
    // Mostrar servicios actuales en la sección correspondiente
    displayCurrentServices();
}

// Mostrar servicios actuales
function displayCurrentServices() {
    // Este elemento no existe en el HTML actual, comentamos por ahora
    const container = document.getElementById('currentServicesList');
    
    if (!container) {
        console.log('Elemento currentServicesList no encontrado, omitiendo visualización');
        return;
    }
    
    if (currentOrder.servicio) {
        container.innerHTML = `
            <div class="service-item">
                <span class="service-name">${currentOrder.servicio}</span>
                <span class="service-price">$${formatCurrency(currentOrder.precio)}</span>
            </div>
        `;
    } else {
        container.innerHTML = '<p>No hay servicios registrados</p>';
    }
}

// Cargar tabla de servicios
async function loadServicesTable() {
    const tableBody = document.getElementById('pricesTableBody');
    
    // Limpiar tabla excepto el header
    const rows = tableBody.querySelectorAll('tr:not(.classification)');
    rows.forEach(row => row.remove());
    
    if (servicesData.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = '<td colspan="4" style="text-align: center;">No hay servicios disponibles</td>';
        tableBody.appendChild(emptyRow);
        return;
    }
    
    servicesData.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${service.nombre}</strong></td>
            <td>${createPriceCell(service.precio_desinfeccion, service.tipo_precio_desinfeccion, 'desinfeccion', service.nombre)}</td>
            <td>${createPriceCell(service.precio_lavado, service.tipo_precio_lavado, 'lavado', service.nombre)}</td>
            <td class="edit-cell">
                <button class="btn-edit" onclick="editServicePrice('${service.nombre}')">✏️</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    setupPriceCellListeners();
}

// Crear celda de precio (reutilizado de scriptsCrearOrden.js)
function createPriceCell(price, dataType, serviceType, serviceName) {
    if (!price || price === '0' || price === 0) {
        return '<span class="empty-price">No disponible</span>';
    }

    const formattedPrice = parseFloat(price).toFixed(2);
    let cellContent = '';

    switch (dataType) {
        case 'proportional':
            cellContent = `
                <div class="price-cell" data-price="${price}" data-type="${dataType}" data-service-type="${serviceType}" data-service-name="${serviceName}">
                    <span class="price-value">$${formattedPrice}/m²</span>
                    <span class="proportional-indicator">📏</span>
                </div>`;
            break;
        case 'range':
            const prices = price.split('-');
            if (prices.length === 2) {
                cellContent = `
                    <div class="price-cell" data-price="${price}" data-type="${dataType}" data-service-type="${serviceType}" data-service-name="${serviceName}">
                        <span class="price-value">$${parseFloat(prices[0]).toFixed(2)} - $${parseFloat(prices[1]).toFixed(2)}</span>
                        <span class="range-indicator">📊</span>
                    </div>`;
            } else {
                cellContent = `<span class="price-value">$${formattedPrice}</span>`;
            }
            break;
        default:
            cellContent = `
                <div class="price-cell" data-price="${price}" data-type="${dataType}" data-service-type="${serviceType}" data-service-name="${serviceName}">
                    <span class="price-value">$${formattedPrice}</span>
                </div>`;
    }

    return cellContent;
}

// Configurar listeners para celdas de precio
function setupPriceCellListeners() {
    const priceCells = document.querySelectorAll('.price-cell');
    priceCells.forEach(cell => {
        cell.addEventListener('click', () => handlePriceCellClick(cell));
    });
}

// Manejar clic en celda de precio
function handlePriceCellClick(cell) {
    const price = cell.dataset.price;
    const type = cell.dataset.type;
    const serviceType = cell.dataset.serviceType;
    const serviceName = cell.dataset.serviceName;

    switch (type) {
        case 'proportional':
            openProportionalModal(serviceName, serviceType, parseFloat(price));
            break;
        case 'range':
            const prices = price.split('-');
            if (prices.length === 2) {
                openRangeModal(serviceName, parseFloat(prices[0]), parseFloat(prices[1]));
            }
            break;
        default:
            addServiceToList(serviceName, parseFloat(price), serviceType);
    }
}

// Agregar servicio a la lista
function addServiceToList(serviceName, price, serviceType = '') {
    const fullServiceName = serviceType ? `${serviceName} (${serviceType})` : serviceName;
    
    // Solo un servicio por suborden - reemplazar el existente
    selectedServices = [{
        name: fullServiceName,
        price: price,
        type: 'new'
    }];
    
    updateServicesList();
    updateTotalPrice();
}

// Actualizar lista de servicios
function updateServicesList() {
    const serviceList = document.getElementById('serviceList');
    
    serviceList.innerHTML = '';
    
    selectedServices.forEach((service, index) => {
        const serviceLi = document.createElement('li');
        serviceLi.innerHTML = `
            ${service.name} - $${service.price.toFixed(2)}
            <button onclick="editServicePrice(${index})" style="margin-left: 10px; color: blue; border: none; background: none; cursor: pointer; font-size: 14px;" title="Editar precio">✏️</button>
            <button onclick="removeService(${index})" style="margin-left: 5px; color: red; border: none; background: none; cursor: pointer;">❌</button>
        `;
        serviceList.appendChild(serviceLi);
    });
}

// Actualizar precio total
function updateTotalPrice() {
    const total = selectedServices.reduce((sum, service) => sum + parseFloat(service.price), 0);
    document.getElementById('totalPrice').textContent = total.toFixed(2);
}

// Remover servicio
function removeService(index) {
    selectedServices.splice(index, 1);
    updateServicesList();
    updateTotalPrice();
}

// Editar precio de servicio
function editServicePrice(index) {
    const service = selectedServices[index];
    const currentPrice = service.price;
    
    const newPrice = prompt(`Editar precio para "${service.name}":\n\nPrecio actual: $${currentPrice.toFixed(2)}`, currentPrice);
    
    if (newPrice !== null) {
        const parsedPrice = parseFloat(newPrice);
        
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            alert('Por favor ingrese un precio válido (número positivo).');
            return;
        }
        
        selectedServices[index].price = parsedPrice;
        updateServicesList();
        updateTotalPrice();
    }
}

// Restablecer servicios
function restoreServices() {
    initializeCurrentServices();
}

// Configurar listeners del formulario
function setupFormListeners() {
    // Agregar listeners de validación para todos los campos requeridos
    const fields = ['nombre', 'telefono', 'ciudad', 'direccion'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('blur', () => validateFieldOnBlur(fieldId));
        }
    });
    
    // Agregar listener especial para el correo (opcional)
    const correoField = document.getElementById('correo');
    if (correoField) {
        correoField.addEventListener('blur', () => validateFieldOnBlur('correo'));
    }
}

// Validar campo individual
function validateFieldOnBlur(fieldId) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    field.classList.remove('field-error');
    
    const value = field.value.trim();
    let isValid = true;
    
    switch (fieldId) {
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
        case 'ciudad':
            const ciudadRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
            isValid = value && ciudadRegex.test(value);
            break;
        case 'direccion':
            isValid = value && value.length >= 5;
            break;
    }
    
    if (!isValid) {
        field.classList.add('field-error');
    }
}

// Validar todo el formulario
function validateForm() {
    const errors = [];
    
    // Validar campos requeridos
    const nombre = document.getElementById('nombre').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const correo = document.getElementById('correo').value.trim();
    const pais = document.getElementById('pais').value;
    const ciudad = document.getElementById('ciudad').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const fsolicita = document.getElementById('fsolicita').value;
    const fprogram = document.getElementById('fprogram').value;
    const hora = document.getElementById('hora').value;
    const operador = document.getElementById('operador').value;
    
    console.log('Debug todos los campos:', {
        nombre, telefono, correo, pais, ciudad, direccion, fsolicita, fprogram, hora, operador
    });
    
    // Validaciones específicas
    const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    if (!nombre || !nombreRegex.test(nombre)) {
        errors.push('El nombre debe contener solo letras y tener entre 2-50 caracteres');
    }
    
    const telefonoRegex = /^[\d\s\-\(\)\+]{10,20}$/;
    if (!telefono || !telefonoRegex.test(telefono)) {
        errors.push('El teléfono debe tener un formato válido (10-20 caracteres)');
    }
    
    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // El correo es opcional - solo validar formato si tiene contenido
    if (correo && correo.length > 0 && !correoRegex.test(correo)) {
        errors.push('El correo electrónico no tiene un formato válido');
    }
    
    if (!pais) {
        errors.push('Debe seleccionar un país');
    }
    
    const ciudadRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    if (!ciudad || !ciudadRegex.test(ciudad)) {
        errors.push('La ciudad debe contener solo letras y tener entre 2-50 caracteres');
    }
    
    if (!direccion || direccion.length < 5) {
        errors.push('La dirección debe tener al menos 5 caracteres');
    }
    
    if (!fsolicita) {
        errors.push('Debe seleccionar una fecha de solicitud');
    }
    
    if (!fprogram) {
        errors.push('Debe seleccionar una fecha programada');
    }
    
    if (!hora) {
        errors.push('Debe seleccionar una hora');
    }
    
    if (!operador) {
        errors.push('Debe seleccionar un operador');
    }
    
    if (selectedServices.length === 0) {
        errors.push('Debe seleccionar al menos un servicio');
    }
    
    return errors;
}

// Enviar orden modificada
async function submitEditedOrder() {
    // Validar formulario
    const errors = validateForm();
    
    // Debug: verificar qué errores estamos obteniendo
    console.log('Errores de validación:', errors);
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }
    
    // Confirmar modificación
    if (!confirm('¿Está seguro de que desea guardar las modificaciones realizadas a esta orden?')) {
        return;
    }
    
    try {
        // Preparar datos para envío (todos los campos de la tabla)
        const formData = {
            id: orderId,
            cliente: document.getElementById('nombre').value.trim(),
            telefono: document.getElementById('telefono').value.trim(),
            correo: document.getElementById('correo').value.trim(),
            pais: document.getElementById('pais').value,
            ciudad: document.getElementById('ciudad').value.trim(),
            direccion: document.getElementById('direccion').value.trim(),
            fsolicita: document.getElementById('fsolicita').value,
            fprogram: document.getElementById('fprogram').value,
            hprogram: document.getElementById('hora').value,
            operador: document.getElementById('operador').value,
            comenta: document.getElementById('comentarios').value.trim(),
            servicio: selectedServices.map(s => s.name).join(', '),
            precio: selectedServices.reduce((sum, service) => sum + parseFloat(service.price), 0),
            clave: clave
        };
        
        // Debug: mostrar datos que se van a enviar
        console.log('Datos a enviar:', formData);
        console.log('API URL:', `${API_BASE}editOrderItem.php`);
        console.log('API Key:', API_KEY);
        
        // Enviar al servidor
        const response = await fetch(`${API_BASE}editOrderItem.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY,
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Verificar si la respuesta es JSON válida
        let result;
        try {
            const responseText = await response.text();
            console.log('Response text:', responseText);
            result = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            throw new Error('Respuesta del servidor no es JSON válida');
        }
        
        if (result.success) {
            alert('Orden modificada exitosamente');
            // Regresar a la página anterior
            window.location.href = `selorden.html?a=${franq}&b=${user}&c=${nivel}&d=${tipo}&e=${clave}&f=${fult}`;
        } else {
            console.error('Error del servidor:', result);
            showError(result.message || 'Error al modificar la orden');
        }
        
    } catch (error) {
        console.error('Error al enviar la orden:', error);
        showError('Error de conexión al enviar los datos: ' + error.message);
    }
}

// Cancelar edición
function cancelEdit() {
    // Construir URL de regreso con parámetros
    const params = new URLSearchParams();
    if (franq) params.append('a', franq);
    if (user) params.append('b', user);
    if (nivel) params.append('c', nivel);
    if (tipo) params.append('d', tipo);
    if (clave) params.append('e', clave);
    if (fult) params.append('f', fult);
    
    const returnUrl = `selorden.html?${params.toString()}`;
    window.location.href = returnUrl;
}

// Restablecer todos los datos
function restoreAllData() {
    if (!confirm('¿Está seguro de que desea restablecer todos los datos a su estado original?')) {
        return;
    }
    
    // Restaurar datos del formulario
    populateForm();
    
    // Restaurar servicios
    initializeCurrentServices();
    
    // Limpiar errores
    clearErrors();
}

// Funciones de utilidad
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

function formatCurrency(amount) {
    return parseFloat(amount || 0).toFixed(2);
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    errorDiv.scrollIntoView({ behavior: 'smooth' });
}

function clearErrors() {
    const errorDiv = document.getElementById('error-message');
    errorDiv.style.display = 'none';
    
    // Limpiar errores de campos
    const errorFields = document.querySelectorAll('.field-error');
    errorFields.forEach(field => field.classList.remove('field-error'));
}

function showValidationErrors(errors) {
    showError(errors.join('\n'));
}

// Funciones para modales (reutilizadas de scriptsCrearOrden.js)
function openProportionalModal(serviceName, serviceType, pricePerM2) {
    document.getElementById('modalTitle').textContent = `${serviceName} (${serviceType})`;
    document.getElementById('proportionalModal').style.display = 'block';
    document.getElementById('rangeModal').style.display = 'none';
    document.getElementById('customModal').style.display = 'none';
    document.getElementById('editPriceModal').style.display = 'none';
    
    document.getElementById('areaSize').value = '';
    document.getElementById('calculatedPrice').textContent = '0';
    
    document.getElementById('areaSize').addEventListener('input', function() {
        const area = parseFloat(this.value) || 0;
        const totalPrice = area * pricePerM2;
        document.getElementById('calculatedPrice').textContent = totalPrice.toFixed(2);
    });
    
    document.getElementById('confirmModalBtn').onclick = () => confirmProportionalService(serviceName, serviceType, pricePerM2);
    document.getElementById('modalOverlay').style.display = 'flex';
}

function confirmProportionalService(serviceName, serviceType, pricePerM2) {
    const area = parseFloat(document.getElementById('areaSize').value) || 0;
    if (area <= 0) {
        alert('Por favor ingrese un área válida mayor a 0');
        return;
    }
    
    const totalPrice = area * pricePerM2;
    const fullServiceName = `${serviceName} (${serviceType}) - ${area}m²`;
    
    addServiceToList(fullServiceName, totalPrice, serviceType);
    closeModal();
}

function openRangeModal(serviceName, priceMin, priceMax) {
    document.getElementById('modalTitle').textContent = serviceName;
    document.getElementById('proportionalModal').style.display = 'none';
    document.getElementById('rangeModal').style.display = 'block';
    document.getElementById('customModal').style.display = 'none';
    document.getElementById('editPriceModal').style.display = 'none';
    
    document.getElementById('minPrice').textContent = priceMin.toFixed(2);
    document.getElementById('maxPrice').textContent = priceMax.toFixed(2);
    
    document.getElementById('minRangeBtn').onclick = () => confirmRangeService(serviceName, priceMin, 'mínimo');
    document.getElementById('maxRangeBtn').onclick = () => confirmRangeService(serviceName, priceMax, 'máximo');
    
    document.getElementById('confirmModalBtn').style.display = 'none';
    document.getElementById('modalOverlay').style.display = 'flex';
}

function confirmRangeService(serviceName, price, rangeType) {
    const fullServiceName = `${serviceName} (${rangeType})`;
    addServiceToList(fullServiceName, price);
    closeModal();
}

function addService() {
    document.getElementById('modalTitle').textContent = 'Agregar Servicio Personalizado';
    document.getElementById('proportionalModal').style.display = 'none';
    document.getElementById('rangeModal').style.display = 'none';
    document.getElementById('customModal').style.display = 'block';
    document.getElementById('editPriceModal').style.display = 'none';
    
    document.getElementById('customServiceName').value = '';
    document.getElementById('customServicePrice').value = '';
    
    document.getElementById('confirmModalBtn').onclick = confirmCustomService;
    document.getElementById('confirmModalBtn').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'flex';
}

function confirmCustomService() {
    const serviceName = document.getElementById('customServiceName').value.trim();
    const servicePrice = parseFloat(document.getElementById('customServicePrice').value) || 0;
    
    if (!serviceName) {
        alert('Por favor ingrese el nombre del servicio');
        return;
    }
    
    if (servicePrice <= 0) {
        alert('Por favor ingrese un precio válido mayor a 0');
        return;
    }
    
    addServiceToList(serviceName, servicePrice);
    closeModal();
}

function editServicePrice(serviceName) {
    const serviceIndex = selectedServices.findIndex(service => 
        service.name.includes(serviceName)
    );
    
    if (serviceIndex === -1) {
        alert('Debe agregar este servicio primero antes de editarlo');
        return;
    }
    
    openEditPriceModal(serviceName, serviceIndex);
}

function openEditPriceModal(serviceName, serviceIndex) {
    document.getElementById('modalTitle').textContent = `Editar precio: ${serviceName}`;
    document.getElementById('proportionalModal').style.display = 'none';
    document.getElementById('rangeModal').style.display = 'none';
    document.getElementById('customModal').style.display = 'none';
    document.getElementById('editPriceModal').style.display = 'block';
    
    document.getElementById('editServicePrice').value = selectedServices[serviceIndex].price;
    
    document.getElementById('confirmModalBtn').onclick = () => confirmEditPrice(serviceName, serviceIndex);
    document.getElementById('confirmModalBtn').style.display = 'block';
    document.getElementById('modalOverlay').style.display = 'flex';
}

function confirmEditPrice(serviceName, serviceIndex) {
    const newPrice = parseFloat(document.getElementById('editServicePrice').value) || 0;
    
    if (newPrice <= 0) {
        alert('Por favor ingrese un precio válido mayor a 0');
        return;
    }
    
    selectedServices[serviceIndex].price = newPrice;
    updateServicesList();
    updateTotalPrice();
    closeModal();
}

function closeModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}
