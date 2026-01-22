<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Tabla de Franquicias</title>
  <link rel="stylesheet" href="../css/stylesNew.css">
  <script>
		function getParameterByName(name, url) {
			if (!url) url = window.location.href;
			name = name.replace(/[\[\]]/g, '\\$&');
			var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
				results = regex.exec(url);
			if (!results) return null;
			if (!results[2]) return '';
			return decodeURIComponent(results[2].replace(/\+/g, ' '));
		}
		var afiliado = getParameterByName('a');
		if (afiliado && afiliado.toUpperCase() !== 'CWO') {
			// Redirige a selorden.html (ARREGLA LA RUTA y pasa todos los parámetros)
			window.location.replace("selorden.html" + window.location.search);
		}
	</script>

<script src="../js/scriptsNew.js?v=998" defer></script>
</head>
<body>

<header class="finisher-header header" >
        <div class="header_image_container">
        <div class="header__title">
            <img class="svg" id="u123202" src="../images/LogoOrange.png" width="126" height="49" alt="" data-mu-svgfallback="images/pasted%20svg%20330792x129_poster_.png?crc=3851218457">
            
        <div class="header_data_container">
            <div class="user-info">
                <p class="username">Usuario: <span id="user"></span></p>
                <p class="affiliate">Afiliado a: <span id="franq"></span></p>
                <p class="category">Cat: <span id="cat"></span></p>
                <p class="date" id="fecha"></p>
            </div>
        </div>
        </div>
        <img src="../images/baner800.jpg" class="bebeOrange" alt="Logo">
    </div>
</header>

<div class="tableSeparator">
    <div class="searchContainer">
        <h1>Buscador</h1>
        <input type="text" id="franquiciaSearch" placeholder="Buscar por clave, nombre, ciudad, celular o correo..." oninput="filterByFranchise()" />
    </div>

    <div>
    <h1 class="tabla-title">Tabla de Franquicias</h1>
    </div>

    <div id="adminCreateBtnContainer">

    </div>
</div>

<div class="table-container">
    <div class="table-wrapper">
        <table class="franchiseTable">
            <thead>
                <tr id="franchiseTableHeaderRow">
                    <th>Clave</th>
                    <th>Nombre</th>
                    <th>Ciudad</th>
                    <th>Celular</th>
                    <th>Correo</th>
                    <th>Ingresar</th>
                    <!-- Los th de Editar/Borrar se agregan por JS si corresponde -->
                </tr>
            </thead>
            <tbody id="franchiseTableBody">
                <!-- Las filas se llenarán dinámicamente con JavaScript -->
            </tbody>
        </table>
    </div>
</div>

<!-- Modal de Edición -->
<div id="editModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Editar Franquicia</h2>
        </div>
        <form id="editForm" class="modal-form">
            <input type="hidden" id="editId">
            <div class="form-group">
                <label for="editClave">Clave</label>
                <input type="text" id="editClave" required>
            </div>
            <div class="form-group">
                <label for="editNombre">Nombre</label>
                <input type="text" id="editNombre" required>
            </div>
            <div class="form-group">
                <label for="editCiudad">Ciudad</label>
                <input type="text" id="editCiudad" required>
            </div>
            <div class="form-group">
                <label for="editCelular">Celular</label>
                <input type="tel" id="editCelular" required>
            </div>
            <div class="form-group">
                <label for="editCorreo">Correo</label>
                <input type="email" id="editCorreo" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-cancel" onclick="closeEditModal()">Cancelar</button>
                <button type="submit" class="btn-confirm">Guardar Cambios</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal de Creación -->
<div id="createModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Crear Franquicia</h2>
        </div>
        <form id="createForm" class="modal-form">
            <div class="form-group">
                <label for="createClave">Clave</label>
                <input type="text" id="createClave" required>
            </div>
            <div class="form-group">
                <label for="createNombre">Nombre</label>
                <input type="text" id="createNombre" required>
            </div>
            <div class="form-group">
                <label for="createCiudad">Ciudad</label>
                <input type="text" id="createCiudad" required>
            </div>
            <div class="form-group">
                <label for="createCelular">Celular</label>
                <input type="tel" id="createCelular" required>
            </div>
            <div class="form-group">
                <label for="createCorreo">Correo</label>
                <input type="email" id="createCorreo" required>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-cancel" onclick="closeCreateModal()">Cancelar</button>
                <button type="submit" class="btn-confirm">Crear Franquicia</button>
            </div>
        </form>
    </div>
</div>

<!-- Modal de Creación de Usuarios -->
<div id="createUserModal" class="modal">
    <div class="modal-content">
        <div class="modal-header">
            <h2>Crear Usuario</h2>
        </div>
        <form id="createUserForm" class="modal-form">
            <div class="form-group">
                <label for="createUserAfiliado">Franquicia Afiliada</label>
                <select id="createUserAfiliado" required>
                    <option value="">Seleccionar franquicia...</option>
                    <!-- Las opciones se llenarán dinámicamente con JavaScript -->
                </select>
            </div>
            <div class="form-group">
                <label for="createUserNombre">Nombre de Usuario</label>
                <input type="text" id="createUserNombre" required placeholder="Nombre único del usuario">
            </div>
            <div class="form-group">
                <label for="createUserPassword">Contraseña</label>
                <input type="password" id="createUserPassword" required minlength="6" placeholder="Mínimo 6 caracteres">
            </div>
            <div class="form-group">
                <label for="createUserTipo">Tipo de Usuario</label>
                <select id="createUserTipo" required>
                    <option value="">Seleccionar tipo...</option>
                    <option value="admin">Admin</option>
                    <option value="ventas">Ventas</option>
                    <option value="operaciones">Operaciones</option>
                    <option value="call center">Call Center</option>
                </select>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn-cancel" onclick="closeCreateUserModal()">Cancelar</button>
                <button type="button" class="btn-confirm" onclick="createUser()">Crear Usuario</button>
            </div>
        </form>
    </div>
</div>

<script src="../js/finisher-header.es5.min.js" type="text/javascript"></script>
<script type="text/javascript">
new FinisherHeader({
  "count": 6,
  "size": {
    "min": 1100,
    "max": 1300,
    "pulse": 0
  },
  "speed": {
    "x": {
      "min": 0.1,
      "max": 0.3
    },
    "y": {
      "min": 0.1,
      "max": 0.3
    }
  },
  "colors": {
    "background": "#fc5f07",
    "particles": [
      "#fc3f04",
      "#fccb37",
      "#fc7536"
    ]
  },
  "blending": "overlay",
  "opacity": {
    "center": 1,
    "edge": 0.1
  },
  "skew": 0,
  "shapes": [
    "c"
  ]
});
</script>
<!-- Botón flotante de regresar -->
<button class="btn-back-float" onclick="window.history.back()" title="Regresar a la página anterior" style="position: fixed; top: 20px; right: 30px; padding: 12px 24px; border-radius: 25px; background:  linear-gradient(135deg, #fc5f07 0%, #fc3f04 100%); border: none; box-shadow: 0 4px 15px rgba(252, 95, 7, 0.4); cursor: pointer; display: flex; align-items: center; gap: 8px; z-index: 9999; color: white; font-weight: 600; font-size: 14px; transition: all 0.3s ease;">
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
    </svg>
    Volver
</button>

<script>
// Efecto hover para el botón
document.addEventListener('DOMContentLoaded', function() {
    const btn = document.querySelector('.btn-back-float');
    if (btn) {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 8px 25px rgba(252, 95, 7, 0.6)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style. transform = 'translateY(0)';
            this.style. boxShadow = '0 4px 15px rgba(252, 95, 7, 0.4)';
        });
    }
});
</script>
</body>
</html>