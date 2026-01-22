<?php
// includes/sso-token.php
// Genera y valida tokens SSO para aplicaciones embebidas
// IMPORTANTE: Este archivo debe ser IDÉNTICO en dashboard, residenciales e intra2

define('SSO_SECRET', 'CAMBIA_ESTA_CLAVE_EN_PRODUCCION_a8f5c9d2e1b7f4a3c6d9e2b5a8f1');

function generateSSOToken($userData, $ttl = 300) {
    $payload = [
        'data' => $userData,
        'exp' => time() + $ttl,
        'iat' => time()
    ];
    
    $payloadJson = json_encode($payload);
    $payloadB64 = base64UrlEncode($payloadJson);
    
    $signature = hash_hmac('sha256', $payloadB64, SSO_SECRET, false);
    
    return $payloadB64 . '.' . $signature;
}

function validateSSOToken($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 2) return false;
    
    list($payloadB64, $signature) = $parts;
    
    $expectedSignature = hash_hmac('sha256', $payloadB64, SSO_SECRET, false);
    if (! hash_equals($expectedSignature, $signature)) {
        return false;
    }
    
    $payloadJson = base64UrlDecode($payloadB64);
    $payload = json_decode($payloadJson, true);
    if (!$payload || !isset($payload['exp'], $payload['data'])) {
        return false;
    }
    
    if (time() > $payload['exp']) {
        return false;
    }
    
    return $payload['data'];
}

function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/'));
}
?>