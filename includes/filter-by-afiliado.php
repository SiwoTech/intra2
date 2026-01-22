<?php
// Obtener parámetros del GET
if (session_status() == PHP_SESSION_NONE) session_start();

$usuario_filtro = $_GET['usuario'] ?? '';
$afiliado_filtro = $_GET['afiliado'] ?? '';
$rol_filtro = $_GET['rol'] ?? $_GET['c'] ?? ($_SESSION['rol'] ?? '');
//$afiliado_filtro="CWO";
// Verificar que los parámetros estén presentes
/*if (empty($usuario_filtro) || empty($afiliado_filtro)) {
    die('
    <div style="text-align: center; margin-top: 50px; font-family: Arial;">
        <h3>Acceso Restringido</h3>
        <p>Esta plataforma requiere acceso desde el Dashboard principal.</p>
        <a href="https://cleanworkorangemx.com" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ir al Dashboard</a>
    </div>
    ');
}*/

// Función para obtener datos filtrados por afiliado
function getDataByAfiliado($afiliado) {
    global $pdo; // Asume que tienes conexión PDO
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM tu_tabla WHERE afiliado = ? ORDER BY fecha DESC");
        $stmt->execute([$afiliado]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Exception $e) {
        return [];
    }
}

// Función para verificar si el afiliado tiene acceso a ciertos datos
function canAccessData($afiliado, $data_afiliado) {
    return $afiliado === $data_afiliado;
}

// Variables globales para usar en las páginas
$current_user = $usuario_filtro;
$current_afiliado = $afiliado_filtro;
$current_rol1 = $rol_filtro;
?>