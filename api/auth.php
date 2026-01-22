<?php
function validateApiKey() {
    $headers = apache_request_headers();
    $apiKey = '';
    
    // Buscar la API key en diferentes formatos de header
    foreach ($headers as $header => $value) {
        if (strtolower($header) === 'x-api-key') {
            $apiKey = $value;
            break;
        }
    }
    
    // Verificar si la key coincide
    if ($apiKey === 'orange-2025') {
        return true;
    }
    
    error_log('API Key inválida o no proporcionada: ' . $apiKey);
    return false;
}