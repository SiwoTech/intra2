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
    var nivel_desc = getParameterByName('d');

    // --- INICIO: Obtener datos de las APIs y organizarlos ---
    const API_KEY = 'orange-2025';
    const API_BASE = 'http://localhost/intra2/api/';

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

    // Arreglos globales para guardar los datos
    let franquicias = [];
    let afiliados = [];
    let currentUserInfo = null; // Variable global para información del usuario

    // Obtener franquicias según el tipo de usuario
    async function fetchFranchises() {
		try {
			// Primero obtener información del usuario
			const userInfoResponse = await fetch(
				API_BASE + 'getUserInfo.php?username=' + encodeURIComponent(user), {
					method: 'GET',
					headers: { 'X-API-Key': API_KEY }
				}
			);
			const userInfoJson = await userInfoResponse.json();
			if (!userInfoJson.success) {
				console.error('Error obteniendo información del usuario:', userInfoJson.error);
				return;
			}
			const userInfo = userInfoJson.data;

			// Pasa SIEMPRE user_role/user_nivel
			const franchiseParams = new URLSearchParams({
				username: userInfo.nombre,
				user_type: userInfo.nivel_desc,
				user_franchise: userInfo.afiliado,
				user_role: nivel  // <--- corrige: pasa 'nivel' leído directamente de la URL
			});

			const response = await fetch(API_BASE + 'getFranchises.php?' + franchiseParams.toString(), {
				method: 'GET',
				headers: { 'X-API-Key': API_KEY }
			});
			const json = await response.json();

			if (json.success) {
				franquicias = Array.isArray(json.data) ? json.data : [];
				afiliados = franquicias;
				currentUserInfo = userInfo;
				window.afiliadosId      = afiliados.map(a => a.id);
				window.afiliadosClave   = afiliados.map(a => a.clave);
				window.afiliadosNombre  = afiliados.map(a => a.nombre);
				window.afiliadosCiudad  = afiliados.map(a => a.ciudad);
				window.afiliadosCelular = afiliados.map(a => a.celular);
				window.afiliadosCorreo  = afiliados.map(a => a.correo);
			} else {
				console.error('Error obteniendo franquicias:', json.error);
				franquicias = [];
				afiliados = [];
				currentUserInfo = null;
			}
			window.afiliadosFultimo = afiliados.map(a => a.fultimo);
		} catch (e) {
			console.error('Error al obtener franquicias:', e);
		}
	}

    // Función auxiliar para verificar si el usuario actual es administrador
    function isCurrentUserAdmin() {
        if (currentUserInfo) {
            return currentUserInfo.is_admin;
        }
        // Fallback al parámetro URL si no hay info del usuario
        return nivel_desc && nivel_desc.toLowerCase() === 'admin';
    }

    // --- FIN: Obtener datos de las APIs y organizarlos ---

// Función para renderizar la tabla de franquicias
function renderFranchiseTable() {
    const tableBody = document.getElementById('franchiseTableBody');
    tableBody.innerHTML = '';
    franquicias.forEach(franq => {
        const row = document.createElement('tr');
        // Sanitizar el nombre para usarlo como clase (sin espacios ni caracteres especiales)
        const className = franq.clave.toLowerCase() + franq.nombre.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() + franq.ciudad.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() + franq.celular.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase() + franq.correo.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
        row.className = className;
        
        // Agregar atributos de datos para facilitar la búsqueda
        row.setAttribute('data-clave', franq.clave.toLowerCase());
        row.setAttribute('data-nombre', franq.nombre.toLowerCase());
        row.setAttribute('data-ciudad', franq.ciudad.toLowerCase());
        row.setAttribute('data-celular', franq.celular.toLowerCase());
        row.setAttribute('data-correo', franq.correo.toLowerCase());
        let extraCols = '';
        if (isCurrentUserAdmin()) {
            extraCols += `<td><button class="btn-info" onclick="editFranchise('${franq.clave}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil" viewBox="0 0 16 16">
  <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325"/>
</svg></button></td>`;
            extraCols += `<td><button class="btn-danger" onclick="deleteFranchise('${franq.clave}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
  <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
</svg></button></td>`;
        }
        row.innerHTML = `
            <td>${franq.clave}</td>
            <td>${franq.nombre}</td>
            <td>${franq.ciudad}</td>
            <td>${franq.celular}</td>
            <td>${franq.correo}</td>
            <td><button class="btn-success" onclick="enterFranchise('${franq.clave}', '${franq.fultimo}')"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
  <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
  <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
</svg></button></td>
            ${extraCols}
        `;
        tableBody.appendChild(row);
    });
}

// Filtrar franquicias por clave, nombre, ciudad, celular o correo
function filterByFranchise() {
    const searchValue = document.getElementById('franquiciaSearch').value.trim().toLowerCase();
    const tableBody = document.getElementById('franchiseTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    Array.from(rows).forEach(row => {
        if (searchValue === '') {
            // Si no hay búsqueda, mostrar todas las filas
            row.style.display = '';
            return;
        }
        
        // Buscar en cada campo específico usando los atributos data
        const clave = row.getAttribute('data-clave') || '';
        const nombre = row.getAttribute('data-nombre') || '';
        const ciudad = row.getAttribute('data-ciudad') || '';
        const celular = row.getAttribute('data-celular') || '';
        const correo = row.getAttribute('data-correo') || '';
        
        // Verificar si el valor de búsqueda coincide con algún campo
        const shouldShow = clave.includes(searchValue) || 
                          nombre.includes(searchValue) || 
                          ciudad.includes(searchValue) || 
                          celular.includes(searchValue) || 
                          correo.includes(searchValue);
        
        row.style.display = shouldShow ? '' : 'none';
    });
}

function enterFranchise(clave, ful) {
        window.location.href = `selorden.html?a=${franq}&b=${user}&c=${nivel}&d=${nivel_desc}&e=${clave}&f=${ful}`;

}

// Funciones para el modal de edición
function editFranchise(clave) {
    const franquicia = franquicias.find(f => f.clave === clave.toString());
    if (!franquicia) return;

    // Llenar el formulario
    document.getElementById('editId').value = franquicia.id;
    document.getElementById('editClave').value = franquicia.clave;
    document.getElementById('editNombre').value = franquicia.nombre;
    document.getElementById('editCiudad').value = franquicia.ciudad;
    document.getElementById('editCelular').value = franquicia.celular;
    document.getElementById('editCorreo').value = franquicia.correo;

    // Mostrar modal
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function deleteFranchise(clave) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta franquicia? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
            const response = await fetch(API_BASE + 'deleteFranqItem.php', {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-Key': API_KEY
                },
                body: JSON.stringify({clave: clave})
            });

            const result = await response.json();
        
        if (response.ok) {
            await fetchFranchises(); // Recargar datos
            renderFranchiseTable(); // Actualizar tabla
            preserveUrlParams(); // Mantener los parámetros de URL
            alert('Franquicia eliminada correctamente');
        } else {
            throw new Error(result.error || 'Error al eliminar');
        }
        } catch (error) {
            alert('Error: ' + error.message);
        }
}

// --- CREAR FRANQUICIA ---
function openCreateModal() {
    document.getElementById('createModal').classList.add('active');
}
function closeCreateModal() {
    document.getElementById('createModal').classList.remove('active');
}

// --- CREAR USUARIO ---
function openCreateUserModal() {
    // Poblar el select de franquicias
    populateFranchiseSelect();
    document.getElementById('createUserModal').classList.add('active');
}
function closeCreateUserModal() {
    document.getElementById('createUserModal').classList.remove('active');
    // Limpiar el formulario
    document.getElementById('createUserForm').reset();
}

async function createUser() {
    
    const data = {
        afiliado: document.getElementById('createUserAfiliado').value,
        nombre: document.getElementById('createUserNombre').value,
        password: document.getElementById('createUserPassword').value,
        tipo: document.getElementById('createUserTipo').value,
        nivel: 'Usuario' // Valor por defecto
    };

    try {
        const response = await fetch(API_BASE + 'createUser.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (result.success) {
            closeCreateUserModal();
            preserveUrlParams();
            alert('Usuario creado exitosamente');
        } else {
            throw new Error(result.error || 'Error al crear usuario');
        }
    } catch (error) {
        console.error('Error al crear usuario:', error);
        alert('Error: ' + error.message);
    }
}

// Función para poblar el select de franquicias con las franquicias disponibles
function populateFranchiseSelect() {
    const select = document.getElementById('createUserAfiliado');
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Seleccionar franquicia...</option>';
    
    // Agregar todas las franquicias disponibles
    franquicias.forEach(franchise => {
        const option = document.createElement('option');
        option.value = franchise.clave;
        option.textContent = `${franchise.clave} - ${franchise.nombre}`;
        select.appendChild(option);
    });
}

// Llamar a las funciones al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    // Actualizar header con datos
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    const fecha = new Date();
    const textoFecha = dias[fecha.getDay()].charAt(0).toUpperCase() + dias[fecha.getDay()].slice(1) + " " + fecha.getDate() + " de " + meses[fecha.getMonth()];
    if (document.getElementById('fecha')) document.getElementById('fecha').textContent = textoFecha;
    if (document.getElementById('franq')) document.getElementById('franq').textContent = franq || '';
    if (document.getElementById('user')) document.getElementById('user').textContent = user || '';
    if (document.getElementById('cat')) document.getElementById('cat').textContent = (nivel ? nivel : '') + (nivel_desc ? ' ' + nivel_desc : '');

    // Agregar los th de Editar/Borrar si es admin
    const headerRow = document.getElementById('franchiseTableHeaderRow');
    
    // Esperar a que se cargue la información del usuario antes de verificar permisos
    await fetchFranchises();
    
    if (headerRow && isCurrentUserAdmin()) {
        // Eliminar th previos para evitar duplicados
        let ths = headerRow.querySelectorAll('th');
        ths.forEach(th => {
            if (th.textContent === 'Editar' || th.textContent === 'Borrar') {
                headerRow.removeChild(th);
            }
        });
        // Agregar ths
        const thEditar = document.createElement('th');
        thEditar.textContent = 'Editar';
        headerRow.appendChild(thEditar);
        const thBorrar = document.createElement('th');
        thBorrar.textContent = 'Borrar';
        headerRow.appendChild(thBorrar);
    }

    // Solo admins pueden crear - verificar después de cargar datos del usuario
    if (isCurrentUserAdmin()) {
        // Crear botón para franquicias
        const btnFranchise = document.createElement('button');
        btnFranchise.textContent = 'Crear Franquicia';
        btnFranchise.className = 'btn-confirm';
        btnFranchise.onclick = openCreateModal;
        btnFranchise.style.marginRight = '1rem';
        document.getElementById('adminCreateBtnContainer').appendChild(btnFranchise);
        
        // Crear botón para usuarios
        const btnUser = document.createElement('button');
        btnUser.textContent = 'Crear Usuario';
        btnUser.className = 'btn-confirm';
        btnUser.onclick = openCreateUserModal;
        document.getElementById('adminCreateBtnContainer').appendChild(btnUser);
    }

    // Solo admins pueden crear
    renderFranchiseTable();

    // Agregar el event listener al formulario de edición
    const editForm = document.getElementById('editForm');
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const data = {
                id: document.getElementById('editId').value,
                clave: document.getElementById('editClave').value,
                nombre: document.getElementById('editNombre').value,
                ciudad: document.getElementById('editCiudad').value,
                celular: document.getElementById('editCelular').value,
                correo: document.getElementById('editCorreo').value
            };

            try {
                const response = await fetch(API_BASE + 'editTableItem.php', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-API-Key': API_KEY
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                
                if (response.ok) {
                    await fetchFranchises(); // Recargar datos
                    renderFranchiseTable(); // Actualizar tabla
                    closeEditModal();
                    preserveUrlParams(); // Mantener los parámetros de URL
                    alert('Franquicia actualizada correctamente');
                } else {
                    throw new Error(result.error || 'Error al actualizar');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // Evento submit para crear franquicia
    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const data = {
                clave: document.getElementById('createClave').value,
                nombre: document.getElementById('createNombre').value,
                ciudad: document.getElementById('createCiudad').value,
                celular: document.getElementById('createCelular').value,
                correo: document.getElementById('createCorreo').value
            };
            try {
                const response = await fetch(API_BASE + 'createFranchise.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': API_KEY
                    },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (response.ok) {
                    await fetchFranchises();
                    renderFranchiseTable();
                    closeCreateModal();
                    preserveUrlParams();
                    alert('Franquicia creada correctamente');
                } else {
                    throw new Error(result.error || 'Error al crear franquicia');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

});
