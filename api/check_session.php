<?php
session_start();
require_once 'config.php';

// Asegurar que la respuesta sea JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Origin: https://siwo-net.com');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Verificar API key
if (!validateApiKey()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'API key inválida'
    ]);
    exit;
}

// Verificar si el usuario está logueado
if (!isset($_SESSION['logged_in']) || !$_SESSION['logged_in']) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'redirect' => '../index.html'
    ]);
    exit;
}

// Verificar tiempo de inactividad (30 minutos)
if (isset($_SESSION['last_activity']) && (time() - $_SESSION['last_activity'] > 1800)) {
    session_unset();
    session_destroy();
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'redirect' => '../index.html',
        'message' => 'Sesión expirada'
    ]);
    exit;
}

// Actualizar tiempo de última actividad
$_SESSION['last_activity'] = time();

// Devolver datos de sesión si todo está bien
echo json_encode([
    'success' => true,
    'user' => [
        'username' => $_SESSION['username'],
        'afiliado' => $_SESSION['afiliado'],
        'nivel' => $_SESSION['nivel'],
        'tipo' => $_SESSION['tipo']
    ]
]);
?>
