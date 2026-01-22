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


// Arreglos globales para guardar los datos
let franquicias = [];
let afiliados = [];
let allOrders = []; // Almacena todas las órdenes
let displayedOrders = []; // Almacena las órdenes actualmente mostradas
let currentPage = 1;
const ordersPerPage = 50;
let isLoading = false;

// Obtener franquicias
async function fetchFranchises() {
    try {
        // Primero obtener información del usuario
        const userInfoResponse = await fetch(API_BASE + 'getUserInfo.php?username=' + encodeURIComponent(user), {
            method: 'GET',
            headers: { 'X-API-Key': API_KEY }
        });
        const userInfoJson = await userInfoResponse.json();
        
        if (!userInfoJson.success) {
            console.error('Error obteniendo información del usuario:', userInfoJson.error);
            return;
        }
        
        const userInfo = userInfoJson.data;
        
        // Luego obtener franquicias filtradas
        const franchiseParams = new URLSearchParams({
            username: userInfo.nombre,
            user_type: userInfo.tipo,
            user_franchise: userInfo.afiliado
        });
        
        const response = await fetch(API_BASE + 'getFranchises.php?' + franchiseParams.toString(), {
            method: 'GET',
            headers: { 'X-API-Key': API_KEY }
        });
        const json = await response.json();
        
        if (json.success) {
            franquicias = Array.isArray(json.data) ? json.data : [];
            afiliados = franquicias; // Mantener compatibilidad
            
            // Organizar datos para compatibilidad con código existente
            window.afiliadosId = afiliados.map(a => a.id);
            window.afiliadosClave = afiliados.map(a => a.clave);
            window.afiliadosNombre = afiliados.map(a => a.nombre);
            window.afiliadosCiudad = afiliados.map(a => a.ciudad);
            window.afiliadosCelular = afiliados.map(a => a.celular);
            window.afiliadosCorreo = afiliados.map(a => a.correo);
            window.afiliadosFultimo = afiliados.map(a => a.fultimo);
        } else {
            console.error('Error obteniendo franquicias:', json.error);
            franquicias = [];
            afiliados = [];
        }
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

// Variables para el ordenamiento
let currentSortColumn = '';
let currentSortDirection = 'asc';

// Función para ordenar las órdenes
function sortOrders(column, skipDirectionToggle = false) {
    const columnTypes = {
        'item': 'number',
        'orden': 'number',
        'suborden': 'number',
        'fechareg': 'date',
        'cliente': 'string',
        'telefono': 'string',
        'ciudad': 'string',
        'servicio': 'string',
        'precio': 'number',
        'fsolicita': 'date',
        'fprogram': 'date',
        'hprogram': 'string',
        'operador': 'number',
        'fconclu': 'date',
        'creador': 'string'
    };

    // Actualizar dirección de ordenamiento
    if (!skipDirectionToggle) {
        if (currentSortColumn === column) {
            currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortColumn = column;
            currentSortDirection = 'asc';
        }
    }

    // Actualizar iconos y clases de los encabezados
    const headers = document.querySelectorAll('.franchiseTable th.sort-th');
    headers.forEach(header => {
        header.classList.remove('sort-asc', 'sort-desc');
        const icon = header.querySelector('.sort-icon');
        if (icon) icon.className = 'sort-icon inactive';
    });

    const currentHeader = Array.from(headers).find(header => {
        // Buscar el th por el atributo onclick
        const onclick = header.getAttribute('onclick');
        return onclick && onclick.includes(`'${column}'`);
    });
    if (currentHeader) {
        currentHeader.classList.add(`sort-${currentSortDirection}`);
        const icon = currentHeader.querySelector('.sort-icon');
        if (icon) icon.className = `sort-icon ${currentSortDirection}`;
    }

    // Ordenar los datos
    const ordersToSort = isFiltered ? filteredOrders : allOrders;
    
    ordersToSort.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        switch (columnTypes[column]) {
            case 'number':
                valueA = valueA ? parseFloat(valueA) : 0;
                valueB = valueB ? parseFloat(valueB) : 0;
                break;
            case 'date':
                valueA = valueA ? new Date(valueA) : new Date(0);
                valueB = valueB ? new Date(valueB) : new Date(0);
                break;
            case 'string':
            default:
                valueA = valueA ? valueA.toString().toLowerCase() : '';
                valueB = valueB ? valueB.toString().toLowerCase() : '';
                break;
        }

        if (valueA < valueB) return currentSortDirection === 'asc' ? -1 : 1;
        if (valueA > valueB) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    // Recargar la tabla
    currentPage = 1;
    displayedOrders = [];
    isLoading = false; // Resetear estado de carga
    
    console.log('sortOrders: Reiniciando tabla con ordenamiento', {
        column,
        direction: currentSortDirection,
        totalOrders: ordersToSort.length
    });
    
    loadMoreOrders();
    
    // Actualizar estadísticas después del ordenamiento
    updateStats();

    // Reiniciar el sentinel y el observer para scroll infinito
    setTimeout(() => {
        // Elimina el sentinel anterior si existe
        const oldSentinel = document.getElementById('sentinel');
        if (oldSentinel) oldSentinel.remove();
        
        // Solo configurar scroll infinito si hay resultados y más contenido que cargar
        const ordersToUse = isFiltered ? filteredOrders : allOrders;
        if (ordersToUse.length > 0 && displayedOrders.length < ordersToUse.length) {
            console.log('sortOrders: Configurando scroll infinito después del ordenamiento');
            setupInfiniteScroll();
        }
    }, 100);
}

// Función de debug para inspeccionar datos de órdenes
function debugOrderData() {
    console.log('=== DEBUG DATOS DE ÓRDENES ===');
    console.log('Total órdenes:', allOrders.length);
    console.log('Órdenes mostradas:', displayedOrders.length);
    console.log('Página actual:', currentPage);
    console.log('Está cargando:', isLoading);
    console.log('Está filtrado:', isFiltered);
    if (isFiltered) {
        console.log('Órdenes filtradas:', filteredOrders.length);
    }
    console.log('Filtro de búsqueda actual:', currentSearchFilter);
    console.log('Primera orden:', allOrders[0]);
    console.log('Última orden:', allOrders[allOrders.length - 1]);
    console.log('Franquicias disponibles:', franquicias.length);
}

// ===========================================
// FUNCIONES DE ESTADÍSTICAS
// ===========================================

// Función para calcular y mostrar estadísticas
function calculateAndDisplayStats() {
    console.log('📊 Calculando estadísticas de órdenes...');
    
    const ordersToAnalyze = isFiltered ? filteredOrders : allOrders;
    
    // Obtener fecha de hoy en formato YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];
    
    // Agrupar por número de orden único para contar correctamente
    const uniqueOrders = new Map();
    
    ordersToAnalyze.forEach(order => {
        const orderNumber = order.orden;
        
        if (!uniqueOrders.has(orderNumber)) {
            // Primera vez que vemos esta orden
            uniqueOrders.set(orderNumber, {
                orden: orderNumber,
                fechareg: order.fechareg,
                fconclu: order.fconclu,
                totalPrice: 0,
                suborders: [],
                isCompleted: false
            });
        }
        
        const uniqueOrder = uniqueOrders.get(orderNumber);
        
        // Agregar suborden a la lista
        uniqueOrder.suborders.push(order);
        
        // Sumar precio de esta suborden
        const precio = parseFloat(order.precio);
        if (!isNaN(precio) && precio > 0) {
            uniqueOrder.totalPrice += precio;
        }
        
        // Una orden se considera completada si TODAS sus subórdenes están completadas
        // O si al menos una suborden tiene fecha de conclusión (depende de la lógica de negocio)
        if (order.fconclu && 
            order.fconclu !== '' && 
            order.fconclu !== '0000-00-00' && 
            order.fconclu !== '0000-00-00 00:00:00') {
            uniqueOrder.isCompleted = true;
            // Usar la fecha de conclusión más reciente
            if (!uniqueOrder.fconclu || order.fconclu > uniqueOrder.fconclu) {
                uniqueOrder.fconclu = order.fconclu;
            }
        }
    });
    
    // Calcular estadísticas basadas en órdenes únicas
    const stats = {
        totalOrders: uniqueOrders.size, // Número de órdenes únicas
        completedOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0,
        todayOrders: 0,
        validPrices: []
    };

    uniqueOrders.forEach(uniqueOrder => {
        // Contar órdenes completadas vs pendientes
        if (uniqueOrder.isCompleted) {
            stats.completedOrders++;              

			// Sumar revenue total (precio total de la orden completa)
			if (uniqueOrder.totalPrice > 0) {
				stats.totalRevenue += uniqueOrder.totalPrice;
				stats.validPrices.push(uniqueOrder.totalPrice);
			}	
        }else {
            stats.pendingOrders++;
		}	

        // Contar órdenes de hoy (basado en fecha de registro)
        if (uniqueOrder.fechareg && uniqueOrder.fechareg.startsWith(today)) {
            stats.todayOrders++;
        }
    });

    // Calcular precio promedio por orden (no por suborden)
    const averagePrice = stats.validPrices.length > 0 
        ? stats.validPrices.reduce((sum, price) => sum + price, 0) / stats.validPrices.length 
        : 0;

    // Actualizar elementos en el DOM
    updateStatElement('totalOrders', stats.totalOrders);
    updateStatElement('completedOrders', stats.completedOrders);
    updateStatElement('pendingOrders', stats.pendingOrders);
    updateStatElement('totalRevenue', formatCurrency(stats.totalRevenue));
    updateStatElement('todayOrders', stats.todayOrders);
    updateStatElement('averagePrice', formatCurrency(averagePrice));

    console.log('📊 Estadísticas calculadas (por órdenes únicas):', {
        totalSubordenes: ordersToAnalyze.length,
        totalOrdenesUnicas: stats.totalOrders,
        completadas: stats.completedOrders,
        pendientes: stats.pendingOrders,
        ingresoTotal: stats.totalRevenue,
        hoy: stats.todayOrders,
        promedio: averagePrice,
        diferencia: `${ordersToAnalyze.length - stats.totalOrders} subórdenes agrupadas`
    });

    return stats;
}

// Función auxiliar para actualizar elementos de estadísticas
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Agregar animación de contador
        animateNumber(element, value);
    }
}

// Función para animar números (efecto contador)
function animateNumber(element, targetValue) {
    const isNumeric = typeof targetValue === 'number';
    const isCurrency = typeof targetValue === 'string' && targetValue.includes('$');
    
    if (!isNumeric && !isCurrency) {
        element.textContent = targetValue;
        return;
    }

    const startValue = 0;
    const duration = 1000; // 1 segundo
    const startTime = performance.now();
    
    // Extraer número de valor monetario si es necesario
    const numericTarget = isCurrency 
        ? parseFloat(targetValue.replace(/[$,]/g, '')) 
        : targetValue;

    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Usar easing para suavizar la animación
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = startValue + (numericTarget - startValue) * easedProgress;
        
        if (isCurrency) {
            element.textContent = formatCurrency(Math.round(currentValue));
        } else {
            element.textContent = Math.round(currentValue);
        }
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = targetValue; // Asegurar valor final exacto
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// Función para actualizar estadísticas cuando cambian los datos
function updateStats() {
    // Solo actualizar si los elementos de estadísticas existen en la página
    if (document.getElementById('totalOrders')) {
        calculateAndDisplayStats();
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

    // Preservar parámetros URL primero
    preserveUrlParams();
    
    // Obtener datos de franquicias
    await fetchFranchises();
    showCreateOrderBtn();
    
    // Cargar órdenes después de preservar parámetros
    await loadOrders();
    document.getElementById("franq").textContent = franq || 'todas las franquicias';
    
    // Calcular y mostrar estadísticas después de cargar las órdenes
    updateStats();
    
    // Verificar que el scroll infinito esté configurado después de la carga inicial
    setTimeout(() => {
        console.log('Verificación post-carga inicial');
        const ordersToUse = isFiltered ? filteredOrders : allOrders;
        const hasMoreToLoad = displayedOrders.length < ordersToUse.length;
        const sentinel = document.getElementById('sentinel');
        
        console.log('Post-carga:', {
            totalOrders: ordersToUse.length,
            displayedOrders: displayedOrders.length,
            hasMoreToLoad,
            sentinelExists: !!sentinel
        });
        
        if (hasMoreToLoad && !sentinel) {
            console.log('Configurando scroll infinito después de carga inicial');
            setupInfiniteScroll();
        }
    }, 500);
    
    // Configurar visibilidad de columna eliminar según tipo de usuario
    configureDeleteColumnVisibility();
    
    // Hacer disponible la función de debug en window para testing
    window.debugOrderData = debugOrderData;
    
    // Hacer disponibles las funciones de estadísticas para testing
    window.updateStats = updateStats;
    window.calculateAndDisplayStats = calculateAndDisplayStats;
    
    // Función de debug para analizar estructura de órdenes y subórdenes
    window.debugOrderStructure = function() {
        console.log('=== ANÁLISIS DE ESTRUCTURA DE ÓRDENES ===');
        
        if (allOrders.length === 0) {
            console.log('No hay órdenes cargadas para analizar');
            return;
        }
        
        // Agrupar por número de orden
        const orderGroups = new Map();
        
        allOrders.forEach(order => {
            const orderNumber = order.orden;
            if (!orderGroups.has(orderNumber)) {
                orderGroups.set(orderNumber, []);
            }
            orderGroups.get(orderNumber).push(order);
        });
        
        console.log('📊 Resumen:');
        console.log('- Total de registros (subórdenes):', allOrders.length);
        console.log('- Total de órdenes únicas:', orderGroups.size);
        console.log('- Promedio de subórdenes por orden:', (allOrders.length / orderGroups.size).toFixed(2));
        
        // Mostrar distribución de subórdenes
        const distribution = new Map();
        orderGroups.forEach((suborders, orderNumber) => {
            const count = suborders.length;
            distribution.set(count, (distribution.get(count) || 0) + 1);
        });
        
        console.log('📈 Distribución de subórdenes:');
        Array.from(distribution.entries())
            .sort((a, b) => a[0] - b[0])
            .forEach(([suborderCount, orderCount]) => {
                console.log(`  - ${orderCount} órdenes con ${suborderCount} subórden(es)`);
            });
        
        // Mostrar ejemplos de órdenes con múltiples subórdenes
        const multiSuborderExamples = Array.from(orderGroups.entries())
            .filter(([orderNumber, suborders]) => suborders.length > 1)
            .slice(0, 3);
            
        if (multiSuborderExamples.length > 0) {
            console.log('📝 Ejemplos de órdenes con múltiples subórdenes:');
            multiSuborderExamples.forEach(([orderNumber, suborders]) => {
                console.log(`  - Orden ${orderNumber}: ${suborders.length} subórdenes`);
                suborders.forEach((suborder, index) => {
                    console.log(`    ${index + 1}. Suborden ${suborder.suborden} - Cliente: ${suborder.cliente} - Precio: $${suborder.precio}`);
                });
            });
        }
        
        return {
            totalRecords: allOrders.length,
            uniqueOrders: orderGroups.size,
            distribution: Object.fromEntries(distribution)
        };
    };
    
    // Función de prueba para validar cálculos de estadísticas
    window.testOrderStatistics = function() {
        console.log('=== PRUEBA DE CÁLCULOS DE ESTADÍSTICAS ===');
        
        if (allOrders.length === 0) {
            console.log('No hay órdenes cargadas para probar');
            return;
        }
        
        // Método anterior (contando subórdenes)
        const oldMethod = {
            total: allOrders.length,
            completed: allOrders.filter(order => 
                order.fconclu && 
                order.fconclu !== '' && 
                order.fconclu !== '0000-00-00' && 
                order.fconclu !== '0000-00-00 00:00:00'
            ).length,
            totalRevenue: allOrders.reduce((sum, order) => {
                const precio = parseFloat(order.precio);
                return sum + (isNaN(precio) ? 0 : precio);
            }, 0)
        };
        
        // Método nuevo (contando órdenes únicas)
        const uniqueOrders = new Map();
        allOrders.forEach(order => {
            const orderNumber = order.orden;
            if (!uniqueOrders.has(orderNumber)) {
                uniqueOrders.set(orderNumber, {
                    orden: orderNumber,
                    totalPrice: 0,
                    isCompleted: false
                });
            }
            
            const uniqueOrder = uniqueOrders.get(orderNumber);
            const precio = parseFloat(order.precio);
            if (!isNaN(precio) && precio > 0) {
                uniqueOrder.totalPrice += precio;
            }
            
            if (order.fconclu && 
                order.fconclu !== '' && 
                order.fconclu !== '0000-00-00' && 
                order.fconclu !== '0000-00-00 00:00:00') {
                uniqueOrder.isCompleted = true;
            }
        });
        
        const newMethod = {
            total: uniqueOrders.size,
            completed: Array.from(uniqueOrders.values()).filter(order => order.isCompleted).length,
            totalRevenue: Array.from(uniqueOrders.values()).reduce((sum, order) => sum + order.totalPrice, 0)
        };
        
        console.log('📊 Comparación de métodos:');
        console.log('Método anterior (subórdenes):');
        console.log('  - Total:', oldMethod.total);
        console.log('  - Completadas:', oldMethod.completed);
        console.log('  - Revenue total:', formatCurrency(oldMethod.totalRevenue));
        
        console.log('Método nuevo (órdenes únicas):');
        console.log('  - Total:', newMethod.total);
        console.log('  - Completadas:', newMethod.completed);
        console.log('  - Revenue total:', formatCurrency(newMethod.totalRevenue));
        
        console.log('Diferencias:');
        console.log('  - Órdenes:', oldMethod.total - newMethod.total, 'subórdenes agrupadas');
        console.log('  - Completadas:', oldMethod.completed - newMethod.completed, 'diferencia');
        console.log('  - Revenue:', formatCurrency(Math.abs(oldMethod.totalRevenue - newMethod.totalRevenue)), 'diferencia');
        
        return { oldMethod, newMethod };
    };
    
    // Hacer disponibles las funciones de operadores para testing
    window.loadOperatorsForSearch = loadOperatorsForSearch;
    window.updateOperatorSearchSelect = updateOperatorSearchSelect;
    
    // Hacer disponibles las funciones de filtro de fechas para testing
    window.debugDateFilter = function() {
        console.log('=== DEBUG FILTRO DE FECHAS ===');
        console.log('Filtro de fechas activo:', isDateFiltered);
        console.log('Fecha desde:', dateFilterFrom);
        console.log('Fecha hasta:', dateFilterTo);
        console.log('Órdenes totales:', allOrders.length);
        if (isDateFiltered) {
            const dateFiltered = filterByDate(allOrders);
            console.log('Órdenes en rango de fechas:', dateFiltered.length);
        }
        console.log('Filtro general activo:', isFiltered);
        console.log('Órdenes finalmente filtradas:', filteredOrders.length);
    };
    
    window.testDateFilter = function() {
        console.log('=== PRUEBA DE FILTRO DE FECHAS ===');
        
        // Simular configuración de fechas
        dateFilterFrom = '2024-01-01';
        dateFilterTo = '2024-12-31';
        isDateFiltered = true;
        
        console.log('Configurando filtro de fechas para 2024...');
        const filtered = filterByDate(allOrders);
        console.log(`Órdenes filtradas para 2024: ${filtered.length}/${allOrders.length}`);
        
        // Mostrar algunas fechas de ejemplo
        const sampleDates = allOrders.slice(0, 5).map(order => ({
            item: order.item,
            fecha: order.fechareg,
            enRango: new Date(order.fechareg) >= new Date('2024-01-01') && 
                     new Date(order.fechareg) <= new Date('2024-12-31')
        }));
        console.log('Muestra de fechas:', sampleDates);
        
        // Restaurar estado
        dateFilterFrom = null;
        dateFilterTo = null;
        isDateFiltered = false;
    };
    
    // Función para probar la integración completa del filtro de fechas
    window.testDateFilterIntegration = function() {
        console.log('=== PRUEBA DE INTEGRACIÓN DEL FILTRO DE FECHAS ===');
        
        if (allOrders.length === 0) {
            console.log('⚠️ No hay órdenes cargadas para probar');
            return;
        }
        
        // Test 1: Verificar que los elementos del DOM existen
        const dateFrom = document.getElementById('dateFrom');
        const dateTo = document.getElementById('dateTo');
        const clearBtn = document.getElementById('clearDateFilter');
        
        console.log('✅ Test 1 - Elementos DOM:');
        console.log('  - Input fecha desde:', !!dateFrom);
        console.log('  - Input fecha hasta:', !!dateTo);
        console.log('  - Botón limpiar:', !!clearBtn);
        
        if (!dateFrom || !dateTo || !clearBtn) {
            console.error('❌ Faltan elementos del DOM');
            return;
        }
        
        // Test 2: Probar filtro de fechas
        console.log('✅ Test 2 - Configurando filtro para últimos 30 días...');
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
        
        dateFrom.value = thirtyDaysAgo.toISOString().split('T')[0];
        dateTo.value = today.toISOString().split('T')[0];
        
        // Simular eventos
        dateFilterFrom = dateFrom.value;
        dateFilterTo = dateTo.value;
        isDateFiltered = true;
        
        const filteredByDate = filterByDate(allOrders);
        console.log(`  - Órdenes en últimos 30 días: ${filteredByDate.length}/${allOrders.length}`);
        
        // Test 3: Probar filtros combinados
        console.log('✅ Test 3 - Probando filtros combinados...');
        const testSearch = document.getElementById('ordenSearch');
        if (testSearch) {
            testSearch.value = 'test';
        }
        
        const combinedFiltered = applyAllFilters();
        console.log(`  - Órdenes con filtros combinados: ${combinedFiltered.length}`);
        
        // Test 4: Limpiar filtros
        console.log('✅ Test 4 - Limpiando filtros...');
        dateFrom.value = '';
        dateTo.value = '';
        if (testSearch) testSearch.value = '';
        dateFilterFrom = null;
        dateFilterTo = null;
        isDateFiltered = false;
        
        const cleanFiltered = applyAllFilters();
        console.log(`  - Órdenes sin filtros: ${cleanFiltered.length} (debería ser ${allOrders.length})`);
        
        console.log('✅ Prueba de integración completada');
    };
    
    // Función de debug para el sistema de paginación
    window.debugPagination = function() {
        console.log('=== DEBUG PAGINACIÓN ===');
        console.log('Total órdenes cargadas:', allOrders.length);
        console.log('Órdenes mostradas:', displayedOrders.length);
        console.log('Página actual:', currentPage);
        console.log('Órdenes por página:', ordersPerPage);
        console.log('Estado de carga:', isLoading);
        console.log('Está filtrado:', isFiltered);
        if (isFiltered) {
            console.log('Órdenes filtradas:', filteredOrders.length);
        }
        console.log('Columna de ordenamiento:', currentSortColumn);
        console.log('Dirección de ordenamiento:', currentSortDirection);
        
        const sentinel = document.getElementById('sentinel');
        console.log('Sentinel existe:', !!sentinel);
        
        const ordersToUse = isFiltered ? filteredOrders : allOrders;
        const hasMoreToLoad = displayedOrders.length < ordersToUse.length;
        console.log('Hay más contenido que cargar:', hasMoreToLoad);
        
        return {
            totalOrders: allOrders.length,
            displayedOrders: displayedOrders.length,
            currentPage,
            ordersPerPage,
            isLoading,
            isFiltered,
            filteredOrders: isFiltered ? filteredOrders.length : 0,
            hasMoreToLoad,
            sentinelExists: !!sentinel
        };
    };
    
    // Función para probar el sistema de paginación con datos simulados
    window.testPagination = function(numOrders = 150) {
        console.log(`Generando ${numOrders} órdenes de prueba...`);
        
        // Generar órdenes de prueba
        const testOrders = [];
        for (let i = 1; i <= numOrders; i++) {
            testOrders.push({
                id: i,
                item: i,
                orden: 1000 + i,
                suborden: 1,
                fechareg: new Date().toISOString().split('T')[0],
                cliente: `Cliente Test ${i}`,
                telefono: `555-${String(i).padStart(4, '0')}`,
                ciudad: 'Ciudad Test',
                servicio: 'Servicio Test',
                precio: 100 + (i * 10),
                fsolicita: new Date().toISOString().split('T')[0],
                fprogram: new Date().toISOString().split('T')[0],
                operador: 1,
                fconclu: i % 3 === 0 ? new Date().toISOString().split('T')[0] : '',
                creador: 'Test User'
            });
        }
        
        // Reemplazar órdenes actuales
        allOrders = testOrders;
        currentPage = 1;
        displayedOrders = [];
        isLoading = false;
        isFiltered = false;
        filteredOrders = [];
        
        // Limpiar tabla
        const tableBody = document.getElementById('ordenTableBody');
        tableBody.innerHTML = '';
        
        // Cargar primera página
        loadMoreOrders();
        
        console.log(`Sistema de prueba configurado con ${numOrders} órdenes`);
        return { success: true, totalOrders: allOrders.length };
    };
    
    // Debug para PDF - verificar librerías disponibles
    window.debugPDF = function() {
        console.log('=== DEBUG PDF ===');
        console.log('window.jsPDF:', typeof window.jsPDF);
        console.log('window.jsPDF object:', window.jsPDF);
        console.log('window.jspdf:', typeof window.jspdf);
        console.log('window.jspdf object:', window.jspdf);
        console.log('globalThis.jsPDF:', typeof globalThis.jsPDF);
        
        // Buscar todas las propiedades que contengan 'pdf'
        const pdfProps = Object.keys(window).filter(key => key.toLowerCase().includes('pdf'));
        console.log('Propiedades con "pdf":', pdfProps);
        
        // Si existe window.jspdf, mostrar sus propiedades
        if (window.jspdf) {
            console.log('Propiedades de window.jspdf:', Object.keys(window.jspdf));
            if (window.jspdf.jsPDF) {
                console.log('window.jspdf.jsPDF:', typeof window.jspdf.jsPDF);
                
                try {
                    const testDoc = new window.jspdf.jsPDF();
                    console.log('Prueba de creación de documento: EXITOSA');
                    console.log('Métodos del documento:', Object.getOwnPropertyNames(Object.getPrototypeOf(testDoc)));
                    
                    if (testDoc.autoTable) {
                        console.log('autoTable plugin: DISPONIBLE en documento');
                    } else {
                        console.log('autoTable plugin: NO DISPONIBLE en documento');
                        console.log('window.autoTable:', typeof window.autoTable);
                        console.log('window.jsPDFAutoTable:', typeof window.jsPDFAutoTable);
                    }
                } catch (e) {
                    console.error('Error al crear documento de prueba:', e);
                }
            }
        }
        
        if (window.jsPDF) {
            try {
                const testDoc = new window.jsPDF();
                console.log('Prueba de creación con window.jsPDF: EXITOSA');
                if (testDoc.autoTable) {
                    console.log('autoTable plugin: DISPONIBLE');
                } else {
                    console.log('autoTable plugin: NO DISPONIBLE');
                }
            } catch (e) {
                console.error('Error al crear documento con window.jsPDF:', e);
            }
        }
    };
    
    // Función alternativa para exportar PDF con método diferente
    window.exportToPDFAlternative = function() {
        console.log('=== MÉTODO ALTERNATIVO PDF ===');
        
        // Intentar cargar usando un enfoque diferente
        const loadJsPDFAlternative = () => {
            return new Promise((resolve, reject) => {
                // Remover scripts existentes
                const existingScripts = document.querySelectorAll('script[src*="jspdf"]');
                existingScripts.forEach(script => script.remove());
                
                // Cargar usando jsDelivr CDN
                const script1 = document.createElement('script');
                script1.src = 'https://cdn.jsdelivr.net/npm/jspdf@latest/dist/jspdf.umd.min.js';
                script1.onload = () => {
                    const script2 = document.createElement('script');
                    script2.src = 'https://cdn.jsdelivr.net/npm/jspdf-autotable@latest/dist/jspdf.plugin.autotable.min.js';
                    script2.onload = () => {
                        setTimeout(() => {
                            console.log('Librerías alternativas cargadas');
                            console.log('window.jsPDF:', typeof window.jsPDF);
                            resolve();
                        }, 1000);
                    };
                    script2.onerror = reject;
                    document.head.appendChild(script2);
                };
                script1.onerror = reject;
                document.head.appendChild(script1);
            });
        };
        
        loadJsPDFAlternative().then(() => {
            pdfLoadAttempts = 0; // Reset counter
            exportToPDF();
        }).catch(() => {
            alert('Error con método alternativo. Intenta recargar la página.');
        });
    };
    
    // Función para probar dimensiones del PDF
    window.testPDFDimensions = function() {
        console.log('=== TEST DIMENSIONES PDF ===');
        
        if (!window.jspdf?.jsPDF) {
            console.log('jsPDF no está disponible');
            return;
        }
        
        const doc = new window.jspdf.jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const availableWidth = pageWidth - 20; // Márgenes
        
        console.log('Formato: A4 Horizontal');
        console.log('Ancho total:', pageWidth, 'mm');
        console.log('Alto total:', pageHeight, 'mm');
        console.log('Ancho disponible (con márgenes):', availableWidth, 'mm');
        console.log('Número de columnas:', 15);
        console.log('Ancho promedio por columna:', availableWidth / 15, 'mm');
        
        // Probar con datos de muestra
        const sampleHeaders = ['Item', 'Orden', 'Sub', 'Franq', 'Registro', 'Cliente', 'Teléfono', 'Ciudad', 'Servicio', 'Precio', 'F. Solic.', 'F. Prog.', 'Oper.', 'Concluido', 'Promotor'];
        const sampleData = [['1', '12345', '1', 'PRB', '01/01/25', 'Cliente Test Muy Largo', '5551234567', 'Ciudad Test', 'Servicio Test Largo', '$1000', '01/01/25', '02/01/25', '123', '03/01/25', 'Promotor Test']];
        
        doc.autoTable({
            head: [sampleHeaders],
            body: sampleData,
            startY: 20,
            theme: 'striped',
            tableWidth: 'wrap',
            styles: { fontSize: 6 },
            margin: { left: 10, right: 10 }
        });
        
        console.log('Tabla de prueba generada exitosamente');
        console.log('Descargando PDF de prueba...');
        doc.save('test-dimensiones.pdf');
    };

    // Inicializar sistema de filtros avanzado
    initializeAdvancedSearch();
    
    // Inicializar filtro de fechas
    initializeDateFilter();
});

/* --------------------- */


// Función para cargar las órdenes desde el API
async function loadOrders() {
    try {
        // Obtener la franquicia seleccionada del URL (parámetro 'e')
        const franquicia = getParameterByName('e');

        const response = await fetch(`${API_BASE}getOrders.php?franquicia=${franquicia}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });
        const data = await response.json();

        if (data.data) {
            allOrders = data.data;
            // Ordenar por ID descendente (más nuevos primero)
            allOrders.sort((a, b) => parseInt(b.id) - parseInt(a.id));
            currentPage = 1;
            loadMoreOrders();
            // El setupInfiniteScroll() se llamará desde loadMoreOrders() si es necesario
        } else {
            console.error('No se recibieron datos de órdenes');
        }
    } catch (error) {
        console.error('Error al cargar las órdenes:', error);
    }
}

// Función para cargar más órdenes (lazy loading)
function loadMoreOrders() {
    if (isLoading) {
        console.log('loadMoreOrders: Ya se está cargando, omitiendo');
        return;
    }
    
    isLoading = true;
    const ordersToUse = isFiltered ? filteredOrders : allOrders;
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const newOrders = ordersToUse.slice(startIndex, endIndex);
    
    console.log('loadMoreOrders:', {
        currentPage,
        startIndex,
        endIndex,
        newOrdersCount: newOrders.length,
        totalOrders: ordersToUse.length,
        displayedSoFar: displayedOrders.length,
        isFiltered
    });
    
    if (newOrders.length > 0) {
        displayOrders(newOrders, startIndex === 0);
        currentPage++;
        
        // Solo configurar scroll infinito si hay más órdenes que cargar
        const hasMoreToLoad = endIndex < ordersToUse.length;
        if (hasMoreToLoad) {
            console.log('Hay más órdenes que cargar, configurando scroll infinito');
            setTimeout(() => setupInfiniteScroll(), 100);
        } else {
            console.log('No hay más órdenes que cargar');
        }
    } else if (startIndex === 0 && ordersToUse.length === 0) {
        // Si no hay resultados en la primera carga, mostrar mensaje
        console.log('No hay resultados para mostrar');
        displayNoResults();
    }
    
    isLoading = false;
}

// Función para mostrar las órdenes en la tabla
function displayOrders(orders, clearTable = false) {
    console.log('displayOrders:', {
        newOrdersCount: orders.length,
        clearTable,
        currentDisplayedCount: displayedOrders.length
    });

    const tableBody = document.getElementById('ordenTableBody');
    if (clearTable) {
        tableBody.innerHTML = '';
        displayedOrders = [];
        console.log('Tabla limpiada');
    }

    orders.forEach(order => {
        displayedOrders.push(order);
        const row = document.createElement('tr');
        
        // Determinar si la orden está concluida
        // Una orden está concluida solo si tiene una fecha de conclusión válida
        const isConcluded = order.fconclu && 
                           order.fconclu !== null && 
                           order.fconclu !== '' && 
                           order.fconclu !== '0000-00-00' && 
                           order.fconclu !== '0000-00-00 00:00:00' &&
                           new Date(order.fconclu).getTime() > 0;
        
        // Agregar clase visual para órdenes no concluidas
        if (!isConcluded) {
            row.classList.add('order-pending');
        } else {
            row.classList.add('order-completed');
        }
        
        // Crear botones según el estado y permisos
        let modificarBtn = `<button class="btn-info btn-icon" onclick="editOrder(${order.id})" title="Modificar orden">
            <svg class="icon-btn" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
        </button>`;
        
        let eliminarBtn = '';
        if (tipo === 'admin') {
            eliminarBtn = `<button class="btn-danger btn-icon" onclick="deleteOrder(${order.id})" title="Eliminar orden">
                <svg class="icon-btn" viewBox="0 0 24 24">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                </svg>
            </button>`;
        }
        
        let buscarBtn = '';
        if (isConcluded) {
            buscarBtn = `<button class="btn-info btn-icon" onclick="searchOrder(${order.id})" title="Buscar en base de datos">
                <svg class="icon-btn" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
            </button>`;
        } else {
            buscarBtn = `<button class="btn-disabled btn-icon" disabled title="Búsqueda no disponible hasta que se concluya">
                <svg class="icon-btn" viewBox="0 0 24 24">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
            </button>`;
        }
        
        // Generar botón de reporte individual
        const reportLink = generateReportLink(order);
        const reportBtn = `<button class="btn-secondary btn-icon" onclick="window.open('${reportLink}', '_blank')" title="Ver reporte de impresión">
            <svg class="icon-btn" viewBox="0 0 24 24">
                <path d="M18,3H6V7H18M19,12A1,1 0 0,1 18,11A1,1 0 0,1 19,10A1,1 0 0,1 20,11A1,1 0 0,1 19,12M16,19H8V14H16M19,8H5A3,3 0 0,0 2,11V17H6V21H18V17H22V11A3,3 0 0,0 19,8Z"/>
            </svg>
        </button>`;
        
        row.innerHTML = `
            <td>${order.item}</td>
            <td>${order.orden}</td>
            <td>${order.suborden}</td>
            <td>${formatDate(order.fechareg)}</td>
            <td>${order.cliente}</td>
            <td>${order.telefono}</td>
            <td>${order.ciudad}</td>
            <td>${order.servicio}</td>
            <td>${formatCurrency(order.precio)}</td>
            <td>${formatDate(order.fsolicita)}</td>
            <td>${formatDate(order.fprogram)}</td>
            <td>${formatTime(order.hprogram)}</td>
            <td>${order.operador}</td>
            <td>${formatDate(order.fconclu)}</td>
            <td>${order.creador}</td>
            <td style="text-align: center;">${modificarBtn}</td>
            <td class="delete-column" style="text-align: center;">${eliminarBtn}</td>
            <td style="text-align: center;">${buscarBtn}</td>
            <td style="text-align: center;">${reportBtn}</td>
        `;
        tableBody.appendChild(row);
    });
    // Mostrar rango y total de registros
    const infoDiv = document.getElementById('ordenCountInfo');
    if (infoDiv) {
        let ordersToCount = isFiltered ? filteredOrders : allOrders;
        let totalSuborders = ordersToCount.length;
        let displayed = displayedOrders.length;
        let franquiciaTxt = window.clave ? window.clave : 'todas las franquicias';
        let searchText = document.getElementById('ordenSearch').value;
        
        // Calcular número de órdenes únicas
        const uniqueOrderNumbers = new Set(ordersToCount.map(order => order.orden));
        const totalUniqueOrders = uniqueOrderNumbers.size;
        
        // Construir información de filtros activos
        let filterInfo = '';
        if (isFiltered) {
            let filters = [];
            
            // Filtro de búsqueda
            if (searchText) {
                filters.push(`Búsqueda: "${searchText}"`);
            }
            
            // Filtro de fechas
            if (isDateFiltered) {
                if (dateFilterFrom && dateFilterTo) {
                    filters.push(`Fechas: ${dateFilterFrom} a ${dateFilterTo}`);
                } else if (dateFilterFrom) {
                    filters.push(`Desde: ${dateFilterFrom}`);
                } else if (dateFilterTo) {
                    filters.push(`Hasta: ${dateFilterTo}`);
                }
            }
            
            if (filters.length > 0) {
                filterInfo = ` (${filters.join(' | ')})`;
            }
        }
        
        if (totalSuborders === 0) {
            infoDiv.textContent = `No hay registros para mostrar${isFiltered ? ' con el filtro actual' : ''} para la franquicia: ${franquiciaTxt}${filterInfo}.`;
        } else {
            let statusText = '';
            if (displayed < totalSuborders) {
                statusText = `Mostrando ${displayed} de ${totalSuborders} subórdenes (${totalUniqueOrders} órdenes únicas)${isFiltered ? ' filtradas' : ''} para la franquicia: ${franquiciaTxt}${filterInfo}`;
                statusText += ` • Desplázate hacia abajo para cargar más`;
            } else {
                statusText = `Mostrando todas las ${totalSuborders} subórdenes (${totalUniqueOrders} órdenes únicas)${isFiltered ? ' filtradas' : ''} para la franquicia: ${franquiciaTxt}${filterInfo}`;
            }
            infoDiv.textContent = statusText;
        }
    }
}

// Función para mostrar mensaje cuando no hay resultados
function displayNoResults() {
    const tableBody = document.getElementById('ordenTableBody');
    tableBody.innerHTML = '';
    displayedOrders = [];
    
    // Crear fila con mensaje de no resultados
    const noResultsRow = document.createElement('tr');
    noResultsRow.innerHTML = `
        <td colspan="19" style="text-align: center; padding: 2rem; color: #666; font-style: italic;">
            <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <span>No se encontraron resultados para la búsqueda actual</span>
                <small style="color: #999;">Intenta con otros términos de búsqueda</small>
            </div>
        </td>
    `;
    tableBody.appendChild(noResultsRow);
    
    // Actualizar información de conteo
    const infoDiv = document.getElementById('ordenCountInfo');
    if (infoDiv) {
        const searchText = document.getElementById('ordenSearch').value;
        const franquiciaTxt = window.clave ? window.clave : 'todas las franquicias';
        infoDiv.textContent = `No se encontraron resultados para "${searchText}" en la franquicia: ${franquiciaTxt}`;
    }
}

// Función para formatear fechas
function formatDate(dateString) {
    if (!dateString || 
        dateString === null || 
        dateString === '' || 
        dateString === '0000-00-00' || 
        dateString === '0000-00-00 00:00:00') {
        return '';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
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

// Función para formatear hora
function formatTime(timeString) {
    if (!timeString || 
        timeString === null || 
        timeString === '' || 
        timeString === '00:00:00') {
        return '';
    }
    
    // Si ya viene en formato HH:MM, lo retornamos así
    if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
    }
    
    // Si viene en formato HH:MM:SS, removemos los segundos
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
        return timeString.substring(0, 5);
    }
    
    return timeString;
}

// Variable para mantener las órdenes filtradas
let filteredOrders = [];
let isFiltered = false;
let currentSearchFilter = 'all'; // Filtro actualmente seleccionado

// Variables para el filtro de fechas
let dateFilterFrom = null;
let dateFilterTo = null;
let isDateFiltered = false;

// Configuración de tipos de campo para el filtrado avanzado
const fieldTypes = {
    'all': 'text',
    'item': 'number',
    'orden': 'text',
    'fechareg': 'date',
    'cliente': 'text',
    'telefono': 'text',
    'ciudad': 'text',
    'servicio': 'text',
    'precio': 'number',
    'fsolicita': 'date',
    'fprogram': 'date',
    'hprogram': 'time',
    'operador': 'select', // Para futuras mejoras
    'creador': 'text'
};

// Función para cambiar el tipo de input según el filtro seleccionado
function updateSearchInput(filterType) {
    const searchContainer = document.querySelector('.search-input-container');
    const currentInput = document.getElementById('ordenSearch');
    
    // Si ya existe un select de operadores, lo removemos
    const existingOperatorSelect = document.getElementById('operadorSearch');
    if (existingOperatorSelect) {
        existingOperatorSelect.remove();
    }
    
    // Si el filtro es operador, crear un select
    if (filterType === 'operador') {
        // Ocultar el input normal
        currentInput.style.display = 'none';
        
        // Crear el select de operadores
        const operatorSelect = document.createElement('select');
        operatorSelect.id = 'operadorSearch';
        operatorSelect.className = 'search-operator-select';
        operatorSelect.innerHTML = '<option value="">Cargando operadores...</option>';
        
        // Insertar el select antes del botón de filtros
        const filterBtn = document.getElementById('searchFilterBtn');
        searchContainer.insertBefore(operatorSelect, filterBtn);
        
        // Cargar operadores
        loadOperatorsForSearch();
        
        // Agregar event listener para filtrar cuando cambie la selección
        operatorSelect.addEventListener('change', function() {
            filterByOrder();
        });
        
    } else {
        // Mostrar el input normal y ocultar el select si existe
        currentInput.style.display = 'block';
        
        const inputType = fieldTypes[filterType] || 'text';
        
        // Cambiar el tipo de input
        if (inputType === 'date') {
            currentInput.type = 'date';
            currentInput.placeholder = 'Seleccionar fecha...';
        } else if (inputType === 'time') {
            currentInput.type = 'time';
            currentInput.placeholder = 'Seleccionar hora...';
        } else if (inputType === 'number') {
            currentInput.type = 'number';
            currentInput.placeholder = filterType === 'item' ? 'Buscar por número de item...' : 
                                      filterType === 'precio' ? 'Buscar por precio...' : 'Buscar número...';
        } else {
            currentInput.type = 'text';
            currentInput.placeholder = filterType === 'all' ? 'Buscar en todas las columnas...' :
                                      filterType === 'orden' ? 'Buscar por orden...' :
                                      filterType === 'cliente' ? 'Buscar por cliente...' :
                                      filterType === 'telefono' ? 'Buscar por teléfono...' :
                                      filterType === 'ciudad' ? 'Buscar por ciudad...' :
                                      filterType === 'servicio' ? 'Buscar por servicio...' :
                                      filterType === 'hprogram' ? 'Buscar por hora programada...' :
                                      filterType === 'creador' ? 'Buscar por promotor...' :
                                      `Buscar por ${filterType}...`;
        }
        
        // Limpiar el valor actual del input
        currentInput.value = '';
    }
    
    // Guardar el filtro actual
    currentSearchFilter = filterType;
    
    // Ejecutar búsqueda para limpiar resultados
    filterByOrder();
}

// ===========================================
// FUNCIONES PARA SELECT DE OPERADORES EN BÚSQUEDA
// ===========================================

// Función para cargar operadores para el filtro de búsqueda
async function loadOperatorsForSearch() {
    console.log('🔧 Cargando operadores para búsqueda, franquicia:', clave);
    
    try {
        if (!clave) {
            console.error('No se ha especificado la franquicia (clave) para búsqueda');
            updateOperatorSearchSelect([]);
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
            console.log('✅ Operadores cargados para búsqueda:', data.data.length);
            updateOperatorSearchSelect(data.data);
        } else {
            console.error('Error del servidor:', data.message);
            updateOperatorSearchSelect([]);
        }
        
    } catch (error) {
        console.error('Error al cargar operadores para búsqueda:', error);
        updateOperatorSearchSelect([]);
    }
}

// Función para actualizar el select de operadores en búsqueda
function updateOperatorSearchSelect(operators) {
    const operatorSelect = document.getElementById('operadorSearch');
    
    if (!operatorSelect) {
        console.error('No se encontró el elemento select de operadores para búsqueda');
        return;
    }

    // Limpiar opciones existentes
    operatorSelect.innerHTML = '';

    if (operators.length === 0) {
        operatorSelect.innerHTML = '<option value="">No hay operadores disponibles</option>';
        operatorSelect.disabled = true;
        return;
    }

    // Agregar opción "todos"
    operatorSelect.innerHTML = '<option value="">Todos los operadores</option>';
    
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
    console.log('✅ Select de operadores para búsqueda actualizado con', operators.length, 'operadores');
}

// Función de debug para el sistema de búsqueda de operadores
window.debugOperatorSearch = function() {
    console.log('🔍 === DEBUG BÚSQUEDA DE OPERADORES ===');
    console.log('📍 Estado actual:');
    console.log('- Filtro actual:', currentSearchFilter);
    console.log('- Franquicia (clave):', clave);
    
    const searchInput = document.getElementById('ordenSearch');
    const operatorSelect = document.getElementById('operadorSearch');
    
    console.log('📋 Elementos:');
    console.log('- Input de búsqueda existe:', !!searchInput);
    console.log('- Input visible:', searchInput?.style.display !== 'none');
    console.log('- Select de operadores existe:', !!operatorSelect);
    console.log('- Select visible:', operatorSelect?.style.display !== 'none');
    
    if (operatorSelect) {
        console.log('📝 Estado del select:');
        console.log('- Deshabilitado:', operatorSelect.disabled);
        console.log('- Número de opciones:', operatorSelect.options.length);
        console.log('- Valor seleccionado:', operatorSelect.value);
        
        if (operatorSelect.options.length > 0) {
            console.log('📋 Opciones disponibles:');
            Array.from(operatorSelect.options).forEach((option, index) => {
                console.log(`${index}: "${option.textContent}" (value: ${option.value})`);
            });
        }
    }
    
    console.log('🔄 Probando carga de operadores...');
    loadOperatorsForSearch();
};

// Función para filtrar por fechas
function filterByDate(orders) {
    if (!isDateFiltered || (!dateFilterFrom && !dateFilterTo)) {
        return orders;
    }

    return orders.filter(order => {
        // Usar fecha de registro para el filtro
        const orderDate = new Date(order.fechareg);
        
        // Si la fecha no es válida, excluir la orden
        if (isNaN(orderDate.getTime())) {
            return false;
        }

        // Si solo hay fecha "desde", filtrar desde esa fecha hasta hoy
        if (dateFilterFrom && !dateFilterTo) {
            const fromDate = new Date(dateFilterFrom);
            return orderDate >= fromDate;
        }
        
        // Si solo hay fecha "hasta", filtrar desde el inicio hasta esa fecha
        if (!dateFilterFrom && dateFilterTo) {
            const toDate = new Date(dateFilterTo);
            // Ajustar la fecha "hasta" para incluir todo el día
            toDate.setHours(23, 59, 59, 999);
            return orderDate <= toDate;
        }
        
        // Si hay ambas fechas, filtrar en el rango
        if (dateFilterFrom && dateFilterTo) {
            const fromDate = new Date(dateFilterFrom);
            const toDate = new Date(dateFilterTo);
            // Ajustar la fecha "hasta" para incluir todo el día
            toDate.setHours(23, 59, 59, 999);
            return orderDate >= fromDate && orderDate <= toDate;
        }
        
        return true;
    });
}

// Función para aplicar todos los filtros (búsqueda + fechas)
function applyAllFilters() {
    let ordersToFilter = [...allOrders]; // Copia de todas las órdenes
    
    // Primero aplicar filtro de fechas
    if (isDateFiltered) {
        ordersToFilter = filterByDate(ordersToFilter);
        console.log(`Filtro de fechas aplicado: ${ordersToFilter.length} órdenes en el rango de fechas`);
    }
    
    // Luego aplicar filtro de búsqueda
    let searchText = '';
    
    // Verificar si estamos usando el select de operadores
    if (currentSearchFilter === 'operador') {
        const operatorSelect = document.getElementById('operadorSearch');
        if (operatorSelect) {
            searchText = operatorSelect.value.trim();
        }
    } else {
        const searchInput = document.getElementById('ordenSearch');
        if (searchInput) {
            searchText = searchInput.value.trim();
        }
    }
    
    if (searchText) {
        if (currentSearchFilter === 'all') {
            // Búsqueda en todos los campos
            ordersToFilter = ordersToFilter.filter(order => 
                Object.values(order).some(value => 
                    value && value.toString().toLowerCase().includes(searchText.toLowerCase())
                )
            );
        } else if (currentSearchFilter === 'operador') {
            // Búsqueda específica por ID de operador
            ordersToFilter = ordersToFilter.filter(order => {
                const operadorValue = order.operador;
                if (!operadorValue) return false;
                
                // Comparar directamente con el ID del operador seleccionado
                return operadorValue.toString() === searchText;
            });
        } else {
            // Búsqueda específica por otros campos
            ordersToFilter = ordersToFilter.filter(order => {
                const fieldValue = order[currentSearchFilter];
                if (!fieldValue) return false;
                
                const fieldType = fieldTypes[currentSearchFilter];
                const searchValue = searchText.toLowerCase();
                
                if (fieldType === 'date') {
                    // Para fechas, comparar la fecha formateada o la fecha ISO
                    const dateValue = fieldValue.toString();
                    return dateValue.includes(searchText) || 
                           dateValue.toLowerCase().includes(searchValue);
                } else if (fieldType === 'time') {
                    // Para horas, comparar directamente el valor de tiempo
                    const timeValue = fieldValue.toString();
                    return timeValue.includes(searchText);
                } else if (fieldType === 'number') {
                    // Para números, conversión exacta o búsqueda textual
                    const numericSearch = parseFloat(searchText);
                    const fieldNumeric = parseFloat(fieldValue);
                    
                    return (!isNaN(numericSearch) && !isNaN(fieldNumeric) && fieldNumeric === numericSearch) ||
                           fieldValue.toString().toLowerCase().includes(searchValue);
                } else {
                    // Para texto, búsqueda de subcadenas
                    return fieldValue.toString().toLowerCase().includes(searchValue);
                }
            });
        }
        
        console.log(`Búsqueda en "${currentSearchFilter}": "${searchText}" - Encontrados: ${ordersToFilter.length} resultados`);
    }
    
    return ordersToFilter;
}

// Función para filtrar órdenes con filtro avanzado (modificada)
function filterByOrder() {
    // Limpiar el estado de filtrado anterior
    currentPage = 1;
    displayedOrders = [];
    isLoading = false;
    const tableBody = document.getElementById('ordenTableBody');
    tableBody.innerHTML = '';

    // Aplicar todos los filtros
    filteredOrders = applyAllFilters();
    
    // Determinar si hay algún filtro activo
    let searchText = '';
    if (currentSearchFilter === 'operador') {
        const operatorSelect = document.getElementById('operadorSearch');
        if (operatorSelect) {
            searchText = operatorSelect.value.trim();
        }
    } else {
        const searchInput = document.getElementById('ordenSearch');
        if (searchInput) {
            searchText = searchInput.value.trim();
        }
    }
    
    isFiltered = (searchText || isDateFiltered);
    
    if (!isFiltered) {
        filteredOrders = [];
        console.log('Todos los filtros limpiados - Mostrando todas las órdenes');
    } else {
        console.log(`Filtros aplicados - Mostrando ${filteredOrders.length} órdenes filtradas`);
    }

    // Remover sentinel anterior si existe
    const oldSentinel = document.getElementById('sentinel');
    if (oldSentinel) oldSentinel.remove();

    // Si hay un ordenamiento activo, mantenerlo
    if (currentSortColumn) {
        sortOrders(currentSortColumn, true);
    } else {
        loadMoreOrders();
    }
    
    // Actualizar estadísticas después del filtrado
    updateStats();
}

// Configurar el scroll infinito
function setupInfiniteScroll() {
    // Remover sentinel anterior si existe
    const existingSentinel = document.getElementById('sentinel');
    if (existingSentinel) {
        existingSentinel.remove();
    }

    const tableBody = document.getElementById('ordenTableBody');
    if (!tableBody || tableBody.children.length === 0) {
        return;
    }

    // Verificar si realmente hay más contenido que cargar
    const ordersToUse = isFiltered ? filteredOrders : allOrders;
    const hasMoreToLoad = displayedOrders.length < ordersToUse.length;
    
    if (!hasMoreToLoad) {
        console.log('setupInfiniteScroll: No hay más contenido que cargar');
        return; // No hay más contenido, no crear sentinel
    }

    console.log('setupInfiniteScroll: Configurando scroll infinito', {
        displayedOrders: displayedOrders.length,
        totalOrders: ordersToUse.length,
        hasMoreToLoad
    });

    // Para scroll infinito vertical, usar el viewport (root: null) es más confiable
    const options = {
        root: null, // Usar viewport para scroll vertical
        rootMargin: '100px', // Margen generoso para activar la carga antes
        threshold: 0.1
    };

    // Crear el elemento observador al final de la tabla
    const sentinel = document.createElement('tr');
    sentinel.id = 'sentinel';
    sentinel.style.height = '1px';
    sentinel.style.backgroundColor = 'transparent';
    sentinel.innerHTML = `<td colspan="19" style="height: 1px; padding: 0; border: none;">
        <div style="text-align: center; padding: 1rem; color: #999; font-size: 0.8rem;">
            <span>Cargando más resultados...</span>
        </div>
    </td>`;
    
    // Agregar al final de la tabla
    tableBody.appendChild(sentinel);

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading) {
                const currentOrdersToUse = isFiltered ? filteredOrders : allOrders;
                const stillHasMoreToLoad = displayedOrders.length < currentOrdersToUse.length;
                
                if (stillHasMoreToLoad) {
                    console.log('Sentinel intersecting: Cargando más órdenes...', {
                        displayed: displayedOrders.length,
                        total: currentOrdersToUse.length,
                        remaining: currentOrdersToUse.length - displayedOrders.length
                    });
                    loadMoreOrders();
                } else {
                    // No hay más que cargar, remover el observer
                    console.log('No hay más contenido, removiendo observer');
                    observer.disconnect();
                    sentinel.remove();
                }
            }
        });
    }, options);

    observer.observe(sentinel);
    console.log('Sentinel agregado y observado');
}

// Función para retrasar la búsqueda (debounce)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Aplicar debounce al filtrado
const debouncedFilter = debounce(filterByOrder, 300);

// Función para inicializar el sistema de búsqueda avanzada
function initializeAdvancedSearch() {
    console.log('🔍 Intentando inicializar sistema de búsqueda avanzada...');
    
    // Esperar un momento para asegurar que el DOM esté completamente cargado
    setTimeout(() => {
        const searchFilterBtn = document.getElementById('searchFilterBtn');
        const searchFiltersPanel = document.getElementById('searchFiltersPanel');
        const searchInput = document.getElementById('ordenSearch');
        const filterRadios = document.querySelectorAll('input[name="searchFilter"]');

        // Verificar que todos los elementos existen
        console.log('Verificando elementos del DOM:');
        console.log('- searchFilterBtn:', !!searchFilterBtn, searchFilterBtn);
        console.log('- searchFiltersPanel:', !!searchFiltersPanel, searchFiltersPanel);
        console.log('- searchInput:', !!searchInput, searchInput);
        console.log('- filterRadios:', filterRadios.length, 'elementos encontrados');
        
        if (!searchFilterBtn || !searchFiltersPanel || !searchInput) {
            console.error('❌ Error: Elementos del buscador avanzado no encontrados');
            console.log('DOM actual:', document.documentElement.outerHTML.substring(0, 1000));
            return;
        }

        if (filterRadios.length === 0) {
            console.error('❌ Error: No se encontraron radio buttons para filtros');
            return;
        }

        console.log('✅ Todos los elementos encontrados, configurando eventos...');

        // Toggle del panel de filtros
        searchFilterBtn.addEventListener('click', function(e) {
            console.log('🖱️ Click en botón de filtros');
            e.stopPropagation();
            searchFiltersPanel.classList.toggle('show');
            searchFilterBtn.classList.toggle('active');
            console.log('Panel de filtros visible:', searchFiltersPanel.classList.contains('show'));
        });

        // Cerrar panel al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!searchFiltersPanel.contains(e.target) && !searchFilterBtn.contains(e.target)) {
                searchFiltersPanel.classList.remove('show');
                searchFilterBtn.classList.remove('active');
            }
        });

        // Manejar cambios en los filtros
        filterRadios.forEach((radio, index) => {
            console.log(`📡 Configurando evento para radio ${index}:`, radio.value);
            radio.addEventListener('change', function() {
                if (this.checked) {
                    console.log('🔄 Filtro cambiado a:', this.value);
                    updateSearchInput(this.value);
                    searchFiltersPanel.classList.remove('show');
                    searchFilterBtn.classList.remove('active');
                }
            });
        });

        // Agregar event listener con debounce al input de búsqueda
        console.log('📝 Configurando evento de búsqueda...');
        searchInput.addEventListener('input', function(e) {
            console.log('⌨️ Input de búsqueda:', e.target.value);
            debouncedFilter();
        });
        
        console.log('✅ Sistema de búsqueda avanzada inicializado correctamente');
    }, 100);
}

// Función para inicializar el filtro de fechas
function initializeDateFilter() {
    console.log('📅 Inicializando filtro de fechas...');
    
    const dateFromInput = document.getElementById('dateFrom');
    const dateToInput = document.getElementById('dateTo');
    const clearDateBtn = document.getElementById('clearDateFilter');
    const dateFilterContainer = document.querySelector('.date-filter-container');
    
    if (!dateFromInput || !dateToInput || !clearDateBtn) {
        console.error('❌ Error: Elementos del filtro de fechas no encontrados');
        return;
    }
    
    console.log('✅ Elementos del filtro de fechas encontrados');
    
    // Event listeners para los inputs de fecha
    dateFromInput.addEventListener('change', function() {
        dateFilterFrom = this.value;
        updateDateFilterState();
        console.log('📅 Fecha desde cambiada:', dateFilterFrom);
        debouncedFilter();
    });
    
    dateToInput.addEventListener('change', function() {
        dateFilterTo = this.value;
        updateDateFilterState();
        console.log('📅 Fecha hasta cambiada:', dateFilterTo);
        debouncedFilter();
    });
    
    // Event listener para limpiar filtro de fechas
    clearDateBtn.addEventListener('click', function() {
        console.log('🗑️ Limpiando filtro de fechas');
        dateFromInput.value = '';
        dateToInput.value = '';
        dateFilterFrom = null;
        dateFilterTo = null;
        updateDateFilterState();
        debouncedFilter();
    });
    
    // Función para actualizar el estado visual del filtro de fechas
    function updateDateFilterState() {
        isDateFiltered = !!(dateFilterFrom || dateFilterTo);
        
        if (isDateFiltered) {
            dateFilterContainer.classList.add('active');
        } else {
            dateFilterContainer.classList.remove('active');
        }
        
        // Validar que la fecha "desde" no sea mayor que la fecha "hasta"
        if (dateFilterFrom && dateFilterTo) {
            const fromDate = new Date(dateFilterFrom);
            const toDate = new Date(dateFilterTo);
            
            if (fromDate > toDate) {
                console.warn('⚠️ Advertencia: La fecha "desde" es mayor que la fecha "hasta"');
                // Intercambiar automáticamente las fechas
                dateFilterTo = dateFilterFrom;
                dateToInput.value = dateFilterFrom;
                console.log('🔄 Fechas intercambiadas automáticamente');
            }
        }
        
        console.log('📊 Estado del filtro de fechas:', {
            desde: dateFilterFrom,
            hasta: dateFilterTo,
            activo: isDateFiltered
        });
    }
    
    console.log('✅ Filtro de fechas inicializado correctamente');
}

// Remover el event listener duplicado
// document.getElementById('ordenSearch').addEventListener('input', debouncedFilter);


function showCreateOrderBtn(){
    const createBtnContainer = document.getElementById('OrderCreateBtnContainer');
        createBtnContainer.innerHTML = `
            <div class="button-container">
                <button class="btn-confirm" onclick="createOrder()">Crear Nueva Orden</button>
                <div class="export-dropdown">
                    <button class="btn-export dropdown-toggle" onclick="toggleExportMenu()">
                        <svg class="icon-btn" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                        </svg>
                        Exportar
                        <svg class="dropdown-arrow" viewBox="0 0 24 24">
                            <path d="M7,10L12,15L17,10H7Z"/>
                        </svg>
                    </button>
                    <div class="export-menu" id="exportMenu">
                        <button class="export-option" onclick="exportToText(); closeExportMenu();">
                            <svg class="icon-btn" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            Texto
                        </button>
                        <button class="export-option" onclick="exportToCSV(); closeExportMenu();">
                            <svg class="icon-btn" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            CSV
                        </button>
                        <button class="export-option" onclick="exportToExcel(); closeExportMenu();">
                            <svg class="icon-btn" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            Excel
                        </button>
                        <button class="export-option" onclick="exportToPDF(); closeExportMenu();">
                            <svg class="icon-btn" viewBox="0 0 24 24">
                                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                            </svg>
                            PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
}

function createOrder(){
    window.location.href = `ordenForm.html?a=${franq}&b=${user}&c=${nivel}&d=${tipo}&e=${clave}&f=${fult}`;
}

// Funciones para el menú desplegable de exportación
function toggleExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.toggle('show');
    
    // Cerrar el menú si se hace clic fuera de él
    document.addEventListener('click', function closeOnClickOutside(event) {
        if (!event.target.closest('.export-dropdown')) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeOnClickOutside);
        }
    });
}

function closeExportMenu() {
    const menu = document.getElementById('exportMenu');
    menu.classList.remove('show');
}

// Función para generar el enlace del reporte individual por orden
function generateReportLink(order) {
    const franquicia = window.clave || 'PRB'; // Usar la franquicia actual o PRB por defecto
    const ordenNumber = order.orden;
    const status = order.fconclu && order.fconclu !== '0000-00-00 00:00:00' && order.fconclu !== '' ? 'concluidas' : 'activas';
    
    return `https://siwo-net.com/intra2/impresion/report.php?e=${franquicia}&orden=${ordenNumber}&status=${status}`;
}

// Función de debug para probar la generación de enlaces de reporte
window.testReportLinks = function() {
    console.log('=== PRUEBA DE ENLACES DE REPORTE ===');
    console.log('Franquicia actual:', window.clave);
    
    // Simular órdenes para prueba
    const testOrders = [
        { orden: '1695926283', fconclu: '2023-09-01 10:30:00' }, // Concluida
        { orden: '1695926284', fconclu: '' }, // Activa
        { orden: '1695926285', fconclu: '0000-00-00 00:00:00' }, // Activa
        { orden: '1695926286', fconclu: '2023-09-02 15:45:00' } // Concluida
    ];
    
    testOrders.forEach(order => {
        const link = generateReportLink(order);
        const status = order.fconclu && order.fconclu !== '0000-00-00 00:00:00' && order.fconclu !== '' ? 'concluidas' : 'activas';
        console.log(`Orden ${order.orden} (${status}): ${link}`);
    });
};

// Función para abrir el reporte de impresión
// Función de reporte general - Ya no se usa, ahora se usa reporte individual por fila
// function openPrintReport() {
//     try {
//         const reportUrl = `https://siwo-net.com/intra2/impresion/report.php?e=${encodeURIComponent(clave)}`;
//         console.log('Abriendo reporte de impresión:', reportUrl);
//         
//         // Abrir en nueva pestaña
//         window.open(reportUrl, '_blank');
//     } catch (error) {
//         console.error('Error al abrir reporte de impresión:', error);
//         alert('Error al abrir el reporte de impresión. Inténtalo de nuevo.');
//     }
// }

// Función para editar orden
function editOrder(orderId) {
    window.location.href = `ordenFormEdit.html?id=${orderId}&a=${franq}&b=${user}&c=${nivel}&d=${tipo}&e=${clave}&f=${fult}`;
}

// Función para eliminar orden
async function deleteOrder(orderId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta orden? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await fetch(API_BASE + 'deleteTableItem.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify({
                table: 'ordenes',
                id: orderId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Orden eliminada exitosamente');
            // Recargar las órdenes
            await loadOrders();
        } else {
            alert((data.message || 'Error desconocido'));
        }
    } catch (error) {
        console.error('Error al eliminar orden:', error);
        alert('Error de conexión al eliminar la orden');
    }
}

// Función para concluir orden
function concludeOrder(orderId) {
    window.location.href = `concludeOrder.html?id=${orderId}&a=${franq}&b=${user}&c=${nivel}&d=${tipo}&e=${clave}&f=${fult}`;
}

// Función para buscar orden en la base de datos secundaria
async function searchOrder(orderId) {
    console.log('Buscando orden con ID:', orderId, 'tipo:', typeof orderId);
    console.log('Total de órdenes disponibles:', allOrders.length);
    
    // Buscar la orden con comparación flexible (string y number)
    const order = allOrders.find(o => o.id == orderId || o.id === String(orderId) || String(o.id) === String(orderId));
    
    if (!order) {
        console.error('No se encontró la orden. IDs disponibles:', allOrders.map(o => ({id: o.id, tipo: typeof o.id})));
        alert('Error: No se encontró la orden en la tabla actual');
        return;
    }

    console.log('Orden encontrada:', order);

    try {
        // Mostrar indicador de carga
        const searchBtn = event.target;
        const originalText = searchBtn.innerHTML;
        searchBtn.innerHTML = `<svg class="icon-btn" viewBox="0 0 24 24">
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
        </svg>Buscando...`;
        searchBtn.disabled = true;

        // Realizar consulta a la base de datos secundaria
        const response = await fetch(`${API_BASE}lookForOrder.php?orden=${order.orden}&suborden=${order.suborden}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': API_KEY
            }
        });

        const data = await response.json();

        // Restaurar botón
        searchBtn.innerHTML = originalText;
        searchBtn.disabled = false;

        if (data.success) {
            // Mostrar modal con los datos encontrados
            showOrderSearchModal(data.data, order.orden, order.suborden);
        } else {
            // Mostrar alerta cuando no se encuentra registro
            alert(`No existe registro en la base de datos para:\nOrden: ${order.orden}\nSubOrden: ${order.suborden}`);
        }

    } catch (error) {
        console.error('Error al buscar orden:', error);
        alert('Error de conexión al buscar la orden');
        
        // Restaurar botón en caso de error
        const searchBtn = event.target;
        if (searchBtn) {
            searchBtn.innerHTML = `<svg class="icon-btn" viewBox="0 0 24 24">
                <path d="M15.5,14H20.5L22,15.5V20.5L20.5,22H15.5L14,20.5V15.5L15.5,14M16,16V20H20V16H16M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14Z"/>
            </svg>`;
            searchBtn.disabled = false;
        }
    }
}

// Función para mostrar modal con resultados de búsqueda
function showOrderSearchModal(orderData, orden, suborden) {
    // Crear el modal si no existe
    let modal = document.getElementById('searchOrderModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'searchOrderModal';
        modal.className = 'modal search-modal';
        document.body.appendChild(modal);
    }

    // Contenido del modal
    modal.innerHTML = `
        <div class="modal-content search-modal-content">
            <div class="modal-header">
                <h2>Detalles de la Orden</h2>
                <span class="close-modal" onclick="closeSearchModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="search-info">
                    <p><strong>Búsqueda realizada para:</strong></p>
                    <p>Orden: <strong>${orden}</strong> | SubOrden: <strong>${suborden}</strong></p>
                </div>
                <div class="order-details-grid">
                    <div class="detail-item">
                        <label>Cliente:</label>
                        <span>${orderData.pseudocliente}</span>
                    </div>
                    <div class="detail-item">
                        <label>Clave del Servicio:</label>
                        <span>${orderData.claveservicio}</span>
                    </div>
                    <div class="detail-item">
                        <label>Número de Operador:</label>
                        <span>${orderData.numoper}</span>
                    </div>
                    <div class="detail-item">
                        <label>Fecha de Llegada:</label>
                        <span>${orderData.fechaarriv}</span>
                    </div>
                    <div class="detail-item">
                        <label>ID de Máquina:</label>
                        <span>${orderData.idmaquina}</span>
                    </div>
                    <div class="detail-item">
                        <label>Tiempo de Servicio:</label>
                        <span>${orderData.tiempo}</span>
                    </div>
                    <div class="detail-item">
                        <label>Quién Recibió:</label>
                        <span>${orderData.recibe}</span>
                    </div>
                    <div class="detail-item">
                        <label>Origen:</label>
                        <span>${orderData.origen}</span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeSearchModal()">Cerrar</button>
            </div>
        </div>
    `;

    // Mostrar el modal
    modal.classList.add('active');
}

// Función para cerrar el modal de búsqueda
function closeSearchModal() {
    const modal = document.getElementById('searchOrderModal');
    if (modal) {
        modal.classList.remove('active');
        // Opcional: remover el modal del DOM después de la animación
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}


// Función para configurar la visibilidad de la columna eliminar
function configureDeleteColumnVisibility() {
    console.log(`Configurando visibilidad de columna eliminar para usuario tipo: "${tipo}"`);
    
    // Crear o encontrar el elemento de estilo dinámico
    let styleElement = document.getElementById('dynamic-column-styles');
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'dynamic-column-styles';
        document.head.appendChild(styleElement);
    }
    
    // Definir las reglas CSS según el tipo de usuario
    let cssRules = '';
    
    if (tipo === 'admin') {
        // Si es admin, mostrar la columna eliminar
        cssRules = `
            .delete-column {
                display: table-cell !important;
            }
        `;
        console.log('✅ Usuario admin detectado: mostrando columna eliminar');
    } else {
        // Si no es admin, ocultar la columna eliminar
        cssRules = `
            .delete-column {
                display: none !important;
            }
        `;
        console.log('❌ Usuario no admin detectado: ocultando columna eliminar');
    }
    
    // Aplicar las reglas CSS
    styleElement.textContent = cssRules;
    console.log('CSS aplicado:', cssRules);
}

// ================================
// FUNCIONES DE EXPORTACIÓN DE DATOS
// ================================

// Función para obtener los datos que se van a exportar (respeta filtros y ordenamiento)
function getExportData() {
    const ordersToExport = isFiltered ? filteredOrders : allOrders;
    const searchText = isFiltered ? document.getElementById('ordenSearch').value : '';
    
    const headers = [
        'Item', 'Orden', 'Sub', 'Franq', 'Registro', 'Cliente', 
        'Teléfono', 'Ciudad', 'Servicio', 'Precio', 'F. Solic.', 
        'F. Prog.', 'Hora Prog.', 'Oper.', 'Concluido', 'Promotor'
    ];
    
    const data = ordersToExport.map(order => [
        order.item || '',
        order.orden || '',
        order.suborden || '',
        window.clave || 'PRB',
        formatDateForExport(order.fechareg) || '',
        order.cliente || '',
        order.telefono || '',
        order.ciudad || '',
        order.servicio || '',
        order.precio ? order.precio.toString() : '0.00',
        formatDateForExport(order.fsolicita) || '',
        formatDateForExport(order.fprogram) || '',
        formatTime(order.hprogram) || '',
        order.operador || '',
        formatDateForExport(order.fconclu) || '0000-00-00 00:00:00',
        order.creador || ''
    ]);
    
    return { headers, data, searchText, total: ordersToExport.length };
}

// Función auxiliar para formatear fechas en exportaciones
function formatDateForExport(dateString) {
    if (!dateString || 
        dateString === null || 
        dateString === '' || 
        dateString === '0000-00-00' || 
        dateString === '0000-00-00 00:00:00') {
        return '';
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Para exportaciones, usar formato ISO o local según preferencia
    return dateString; // Mantener formato original para compatibilidad
}

// Función auxiliar para formatear fechas de forma compacta en PDF
function formatDateForPDF(dateString) {
    if (!dateString || 
        dateString === null || 
        dateString === '' || 
        dateString === '0000-00-00' || 
        dateString === '0000-00-00 00:00:00') {
        return '';
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Formato compacto: DD/MM/AA
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Solo últimos 2 dígitos
    
    return `${day}/${month}/${year}`;
}

// Función para generar nombre de archivo con timestamp
function generateFileName(extension, type) {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[T:]/g, '-').replace(/-/g, '');
    const searchText = isFiltered ? `_filtrado` : '';
    const franquiciaTxt = window.clave ? `_${window.clave}` : '_todas';
    return `registros${franquiciaTxt}${searchText}_${timestamp}.${extension}`;
}

// 1. EXPORTAR A TEXTO
function exportToText() {
    try {
        const { headers, data, searchText, total } = getExportData();
        
        let textContent = `
                
                    Nueva Orden
                    
                

            

REGISTROS
${searchText ? `\nFiltro aplicado: "${searchText}"` : ''}
Total de registros: ${total}
Franquicia: ${window.clave || 'todas las franquicias'}
Fecha de exportación: ${new Date().toLocaleString('es-MX')}

${headers.join('\t')}
`;

        data.forEach(row => {
            textContent += row.join('\t') + '\n';
        });

        // Crear y descargar el archivo
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateFileName('txt', 'texto');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Archivo de texto exportado exitosamente con ${total} registros.`);
    } catch (error) {
        console.error('Error al exportar a texto:', error);
        alert('Error al exportar a texto. Inténtalo de nuevo.');
    }
}

// 2. EXPORTAR A CSV
function exportToCSV() {
    try {
        const { headers, data, searchText, total } = getExportData();
        
        // Función para escapar valores CSV
        function escapeCSV(value) {
            if (value === null || value === undefined) return '';
            const stringValue = String(value);
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
        }
        
        // Crear contenido CSV
        let csvContent = '';
        
        // Información del archivo
        csvContent += `# REGISTROS - ${window.clave || 'todas las franquicias'}\n`;
        csvContent += `# Fecha de exportación: ${new Date().toLocaleString('es-MX')}\n`;
        if (searchText) csvContent += `# Filtro aplicado: "${searchText}"\n`;
        csvContent += `# Total de registros: ${total}\n`;
        csvContent += '\n';
        
        // Encabezados
        csvContent += headers.map(escapeCSV).join(',') + '\n';
        
        // Datos
        data.forEach(row => {
            csvContent += row.map(escapeCSV).join(',') + '\n';
        });

        // Crear y descargar el archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateFileName('csv', 'csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`Archivo CSV exportado exitosamente con ${total} registros.`);
    } catch (error) {
        console.error('Error al exportar a CSV:', error);
        alert('Error al exportar a CSV. Inténtalo de nuevo.');
    }
}

// 3. EXPORTAR A EXCEL (usando SheetJS)
function exportToExcel() {
    try {
        // Cargar la librería SheetJS si no está disponible
        if (typeof XLSX === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => exportToExcel();
            script.onerror = () => alert('Error al cargar la librería de Excel. Verifica tu conexión a internet.');
            document.head.appendChild(script);
            return;
        }

        const { headers, data, searchText, total } = getExportData();
        
        // Crear workbook
        const wb = XLSX.utils.book_new();
        
        // Crear worksheet con los datos
        const wsData = [headers, ...data];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Configurar el ancho de las columnas
        const colWidths = headers.map((header, index) => {
            const maxLength = Math.max(
                header.length,
                ...data.map(row => String(row[index] || '').length)
            );
            return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
        });
        ws['!cols'] = colWidths;
        
        // Agregar información del archivo como comentarios
        if (!ws['!comments']) ws['!comments'] = [];
        ws['A1'].c = [{
            a: 'Sistema',
            t: `Franquicia: ${window.clave || 'todas'}\nFecha: ${new Date().toLocaleString('es-MX')}\nTotal: ${total} registros${searchText ? `\nFiltro: "${searchText}"` : ''}`
        }];
        
        // Agregar worksheet al workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Registros');
        
        // Crear y descargar el archivo
        const fileName = generateFileName('xlsx', 'excel');
        XLSX.writeFile(wb, fileName);
        
        alert(`Archivo Excel exportado exitosamente con ${total} registros.`);
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar a Excel. Inténtalo de nuevo.');
    }
}

// 4. EXPORTAR A PDF (usando jsPDF)
let pdfLoadAttempts = 0; // Contador para evitar bucle infinito
const MAX_PDF_LOAD_ATTEMPTS = 3;

function exportToPDF() {
    console.log('=== INICIANDO EXPORTACIÓN PDF ===');
    console.log('Intento número:', pdfLoadAttempts + 1);
    
    try {
        // Verificar disponibilidad de librerías con múltiples métodos
        const hasJsPDF = typeof window.jsPDF !== 'undefined' || 
                         typeof window.jspdf !== 'undefined' ||
                         typeof globalThis.jsPDF !== 'undefined';
        
        console.log('window.jsPDF:', typeof window.jsPDF);
        console.log('window.jspdf:', typeof window.jspdf);
        console.log('hasJsPDF:', hasJsPDF);
        
        // Cargar las librerías jsPDF si no están disponibles
        if (!hasJsPDF && pdfLoadAttempts < MAX_PDF_LOAD_ATTEMPTS) {
            pdfLoadAttempts++;
            console.log('Librerías no encontradas, cargando... (intento', pdfLoadAttempts, 'de', MAX_PDF_LOAD_ATTEMPTS, ')');
            
            // Cargar jsPDF primero, luego autoTable
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
                .then(() => {
                    console.log('jsPDF cargado, verificando...');
                    console.log('window.jsPDF:', typeof window.jsPDF);
                    console.log('window.jspdf:', typeof window.jspdf);
                    
                    // Cargar autoTable después de jsPDF
                    return loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
                })
                .then(() => {
                    console.log('autoTable cargado, verificando disponibilidad...');
                    
                    // Esperar un poco más para asegurar que las librerías se inicialicen
                    setTimeout(() => {
                        console.log('window.jsPDF después de cargar:', typeof window.jsPDF);
                        console.log('window.jspdf después de cargar:', typeof window.jspdf);
                        console.log('Reintentando exportación...');
                        exportToPDF();
                    }, 1500); // Aumentar el tiempo de espera
                })
                .catch((error) => {
                    console.error('Error al cargar librerías:', error);
                    pdfLoadAttempts = 0; // Reset counter
                    alert('Error al cargar las librerías de PDF. Verifica tu conexión a internet.');
                });
            return;
        }
        
        // Si llegamos aquí después de muchos intentos sin éxito
        if (!hasJsPDF && pdfLoadAttempts >= MAX_PDF_LOAD_ATTEMPTS) {
            console.error('Máximo número de intentos alcanzado. Las librerías no se cargaron correctamente.');
            pdfLoadAttempts = 0; // Reset counter
            alert('Error: No se pudieron cargar las librerías de PDF después de varios intentos. Intenta recargar la página.');
            return;
        }

        console.log('Librerías disponibles, continuando...');
        pdfLoadAttempts = 0; // Reset counter on success
        
        const { headers, data, searchText, total } = getExportData();
        
        // Verificar que tenemos datos
        if (!data || data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        console.log(`Exportando ${total} registros...`);
        
        // Crear documento PDF - Buscar el constructor correcto
        let jsPDFConstructor;
        
        // Verificar múltiples ubicaciones donde puede estar jsPDF
        if (window.jsPDF && typeof window.jsPDF === 'function') {
            jsPDFConstructor = window.jsPDF;
            console.log('Usando window.jsPDF');
        } else if (window.jsPDF && window.jsPDF.jsPDF && typeof window.jsPDF.jsPDF === 'function') {
            jsPDFConstructor = window.jsPDF.jsPDF;
            console.log('Usando window.jsPDF.jsPDF');
        } else if (window.jspdf && typeof window.jspdf.jsPDF === 'function') {
            jsPDFConstructor = window.jspdf.jsPDF;
            console.log('Usando window.jspdf.jsPDF');
        } else if (window.jspdf && window.jspdf.default && typeof window.jspdf.default.jsPDF === 'function') {
            jsPDFConstructor = window.jspdf.default.jsPDF;
            console.log('Usando window.jspdf.default.jsPDF');
        } else if (typeof jsPDF !== 'undefined') {
            jsPDFConstructor = jsPDF;
            console.log('Usando jsPDF global');
        } else {
            console.error('No se pudo encontrar el constructor de jsPDF');
            console.log('window.jspdf:', window.jspdf);
            console.log('Propiedades de window.jspdf:', window.jspdf ? Object.keys(window.jspdf) : 'No existe');
            console.log('Propiedades disponibles en window:', Object.keys(window).filter(key => key.toLowerCase().includes('pdf')));
            alert('Error: No se pudo acceder a jsPDF después de cargar las librerías.');
            return;
        }
        
        console.log('Constructor jsPDF encontrado:', typeof jsPDFConstructor);
        
        const doc = new jsPDFConstructor({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4'
        });
        
        console.log('Documento PDF creado exitosamente');
        
        // Verificar que autoTable esté disponible
        if (!doc.autoTable && !jsPDFConstructor.autoTable) {
            console.error('Plugin autoTable no está disponible');
            console.log('doc.autoTable:', typeof doc.autoTable);
            console.log('jsPDFConstructor.autoTable:', typeof jsPDFConstructor.autoTable);
            console.log('Métodos disponibles en doc:', Object.getOwnPropertyNames(Object.getPrototypeOf(doc)));
            
            // Intentar importar autoTable manualmente si está disponible en window
            if (window.autoTable && typeof window.autoTable === 'function') {
                console.log('Intentando usar window.autoTable');
                doc.autoTable = window.autoTable;
            } else if (window.jsPDFAutoTable) {
                console.log('Intentando usar window.jsPDFAutoTable');
                doc.autoTable = window.jsPDFAutoTable;
            } else {
                alert('Error: El plugin autoTable no se cargó correctamente. Intenta recargar la página.');
                return;
            }
        }
        
        console.log('Plugin autoTable verificado:', typeof doc.autoTable);
        
        // Configurar fuente
        doc.setFont('helvetica');
        
        // Título principal
        doc.setFontSize(18);
        doc.setTextColor(252, 95, 7); // Color naranja
        doc.text('REGISTROS - SISTEMA INTRA2', 20, 20);
        
        // Información del reporte
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        let yPosition = 30;
        
        doc.text(`Franquicia: ${window.clave || 'todas las franquicias'}`, 20, yPosition);
        yPosition += 5;
        doc.text(`Fecha de exportación: ${new Date().toLocaleString('es-MX')}`, 20, yPosition);
        yPosition += 5;
        doc.text(`Total de registros: ${total}`, 20, yPosition);
        
        if (searchText) {
            yPosition += 5;
            doc.text(`Filtro aplicado: "${searchText}"`, 20, yPosition);
        }
        
        yPosition += 10;
        
        // Configurar tabla con datos optimizados
        const tableColumns = headers;
        const tableData = data.map(row => 
            row.map((cell, index) => {
                if (cell === null || cell === undefined) return '';
                
                let cellValue = String(cell);
                
                // Optimizar contenido según la columna
                switch (index) {
                    case 3: // Franq - abreviar si es muy largo
                        return cellValue.length > 8 ? cellValue.substring(0, 8) + '...' : cellValue;
                    case 4: // Fecha registro - formato corto
                        return formatDateForPDF(cellValue);
                    case 5: // Cliente - limitar longitud
                        return cellValue.length > 20 ? cellValue.substring(0, 20) + '...' : cellValue;
                    case 6: // Teléfono - formato compacto
                        return cellValue.replace(/[^\d]/g, '').substring(0, 10);
                    case 7: // Ciudad - abreviar si es necesario
                        return cellValue.length > 15 ? cellValue.substring(0, 15) + '...' : cellValue;
                    case 8: // Servicio - abreviar
                        return cellValue.length > 20 ? cellValue.substring(0, 20) + '...' : cellValue;
                    case 9: // Precio - remover símbolo de peso y formatear
                        const precio = cellValue.replace(/^\$/, '').replace(/,/g, '');
                        return precio ? `$${parseFloat(precio).toFixed(0)}` : '$0';
                    case 10: // F. Solicitada - formato corto
                        return formatDateForPDF(cellValue);
                    case 11: // F. Programada - formato corto
                        return formatDateForPDF(cellValue);
                    case 12: // Hora Programada - mantener formato HH:MM
                        return cellValue;
                    case 13: // Operador - mantener como está
                        return cellValue;
                    case 14: // Concluido - formato corto
                        return formatDateForPDF(cellValue);
                    case 15: // Promotor - abreviar si es necesario
                        return cellValue.length > 15 ? cellValue.substring(0, 15) + '...' : cellValue;
                    default:
                        return cellValue;
                }
            })
        );
        
        // Calcular el ancho disponible de la página
        const pageWidth = doc.internal.pageSize.getWidth();
        const availableWidth = pageWidth - 20; // Restar márgenes (10 izq + 10 der)
        
        console.log('Ancho de página:', pageWidth);
        console.log('Ancho disponible:', availableWidth);
        console.log('Número de columnas:', tableColumns.length);
        
        // Optimizar anchos de columna para que quepan todas
        const optimizedColumnStyles = {
            0: { cellWidth: 12 }, // Item - reducido
            1: { cellWidth: 18 }, // Orden - reducido
            2: { cellWidth: 12 }, // Suborden - reducido
            3: { cellWidth: 12 }, // Franq - reducido
            4: { cellWidth: 20 }, // Registro - reducido
            5: { cellWidth: 25 }, // Cliente - reducido
            6: { cellWidth: 18 }, // Telefono - reducido
            7: { cellWidth: 18 }, // Ciudad - reducido
            8: { cellWidth: 25 }, // Servicio - reducido
            9: { cellWidth: 15 }, // Precio - reducido
            10: { cellWidth: 18 }, // F. Solicitada - reducido
            11: { cellWidth: 18 }, // F. Programada - reducido
            12: { cellWidth: 15 }, // Hora Programada - nuevo
            13: { cellWidth: 15 }, // Operador - reducido
            14: { cellWidth: 20 }, // Concluido - reducido
            15: { cellWidth: 18 }  // Promotor - reducido
        };
        
        // Calcular ancho total de columnas
        const totalColumnWidth = Object.values(optimizedColumnStyles).reduce((sum, style) => sum + style.cellWidth, 0);
        console.log('Ancho total de columnas calculado:', totalColumnWidth);
        
        // Si aún no cabe, usar 'auto' para que se ajuste automáticamente
        const finalColumnStyles = totalColumnWidth <= availableWidth ? optimizedColumnStyles : 'auto';
        
        // Generar tabla con configuración optimizada
        doc.autoTable({
            head: [tableColumns],
            body: tableData,
            startY: yPosition,
            theme: 'striped',
            headStyles: {
                fillColor: [252, 95, 7], // Color naranja para header
                textColor: [255, 255, 255],
                fontSize: 7, // Reducido de 8 a 7
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 6, // Reducido de 7 a 6
                textColor: [0, 0, 0],
                halign: 'center',
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            columnStyles: finalColumnStyles,
            margin: { top: yPosition, left: 10, right: 10 },
            pageBreak: 'auto',
            showHead: 'everyPage',
            tableWidth: 'wrap', // Permite que la tabla se ajuste automáticamente
            styles: {
                overflow: 'linebreak', // Permite salto de línea en celdas
                cellPadding: 2,
                lineWidth: 0.1,
                lineColor: [200, 200, 200]
            },
            // Callbacks para manejar texto largo
            didParseCell: function(data) {
                // Ajustar altura de fila si el contenido es muy largo
                if (data.cell.text && data.cell.text.length > 0) {
                    const textLength = data.cell.text.join('').length;
                    if (textLength > 15) {
                        data.cell.styles.fontSize = 5; // Fuente más pequeña para texto largo
                    }
                }
            }
        });
        
        // Agregar número de página
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.getWidth() - 30, doc.internal.pageSize.getHeight() - 10);
        }
        
        // Descargar el archivo
        const fileName = generateFileName('pdf', 'pdf');
        console.log('Guardando archivo PDF:', fileName);
        doc.save(fileName);
        
        alert(`Archivo PDF exportado exitosamente con ${total} registros.`);
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        alert('Error al exportar a PDF: ' + error.message);
    }
}

// Función auxiliar para cargar scripts dinámicamente
function loadScript(src) {
    return new Promise((resolve, reject) => {
        console.log('Cargando script:', src);
        
        // Verificar si el script ya existe
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
            console.log('Script ya existe, verificando si está completamente cargado...');
            
            // Si el script ya existe, verificar si realmente se cargó
            if (existingScript.getAttribute('data-loaded') === 'true') {
                console.log('Script ya cargado completamente');
                resolve();
                return;
            }
        }
        
        const script = document.createElement('script');
        script.src = src;
        script.setAttribute('crossorigin', 'anonymous');
        script.setAttribute('data-loaded', 'false');
        
        script.onload = () => {
            console.log('Script cargado exitosamente:', src);
            script.setAttribute('data-loaded', 'true');
            
            // Verificación adicional para jsPDF
            if (src.includes('jspdf')) {
                setTimeout(() => {
                    const isJsPDFAvailable = typeof window.jsPDF !== 'undefined' || 
                                           typeof window.jspdf !== 'undefined' ||
                                           typeof globalThis.jsPDF !== 'undefined';
                    console.log('jsPDF disponible después de cargar:', isJsPDFAvailable);
                    resolve();
                }, 200);
            } else {
                resolve();
            }
        };
        
        script.onerror = (error) => {
            console.error('Error al cargar script:', src, error);
            script.setAttribute('data-loaded', 'error');
            reject(new Error(`Failed to load script: ${src}`));
        };
        
        // Remover script existente si no se cargó correctamente
        if (existingScript && existingScript.getAttribute('data-loaded') !== 'true') {
            existingScript.remove();
        }
        
        document.head.appendChild(script);
    });
}
// ================================
// FUNCIÓN PARA BOTÓN DE REGRESAR
// ================================

function goBack() {
    // Usar el historial del navegador para regresar
    window.history.back();
}