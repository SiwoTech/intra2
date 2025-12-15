<?php
// Configurar CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
header('Access-Control-Max-Age: 86400'); // 24 horas

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once "db.php";
require_once 'auth.php';

// Verificar API key excepto para OPTIONS
if ($_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
    if (!validateApiKey()) {
        error_log('Falló autenticación API');
        http_response_code(401);
        echo json_encode([
            'error' => 'API key inválida o no proporcionada',
            'headers' => apache_request_headers()
        ]);
        exit;
    }
}

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}
?>
