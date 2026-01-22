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

/*
 * Sólo exigir la API key en endpoints de tipo API o si el archivo lo requiere explícitamente.
 * Por ejemplo, para todos los archivos dentro de /api/, exige la API key.
 * Si el archivo está fuera de /api/ (paneles, dashboards, vistas embebidas), NO la exijas,
 * así pueden abrirse por navegador, iframe, o incluye directo.
 */

$scriptPath = $_SERVER['SCRIPT_NAME'];
$forceApi = (
    strpos($scriptPath, '/api/') !== false ||           // Dentro de carpeta /api/
    preg_match('/(get.*\.php|edit.*\.php|delete.*\.php|create.*\.php)/i', basename($scriptPath)) // endpoints (get*, edit*, delete*, create*)
);

// Exigir API key SÓLO para endpoints de API:
if ($forceApi && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
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

// Para paneles embebidos, dashboards y selfran.html + getFranchises.php cuando acceden directo/vía navegador
// NO exiges la API key y se podrán abrir normalmente sin fetch/AJAX.

// Utilidad para API responses
function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}
?>