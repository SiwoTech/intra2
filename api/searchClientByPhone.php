<?php
// Headers CORS - DEBEN estar PRIMERO
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers:  Content-Type, X-API-Key, Accept');
header('Content-Type: application/json; charset=UTF-8');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// LOG:  Archivo de debug temporal
$logFile = __DIR__ . '/search_client_debug.log';
file_put_contents($logFile, "=== INICIO DEBUG ===\n", FILE_APPEND);
file_put_contents($logFile, "Timestamp: " . date('Y-m-d H:i:s') . "\n", FILE_APPEND);

try {
    file_put_contents($logFile, "Incluyendo archivos.. .\n", FILE_APPEND);
    
    require_once 'config.php';
    require_once 'auth.php';
    
    file_put_contents($logFile, "Archivos incluidos OK\n", FILE_APPEND);
    
    // Validar API Key
    file_put_contents($logFile, "Validando API Key...\n", FILE_APPEND);
    if (! validateApiKey()) {
        file_put_contents($logFile, "API Key inválida\n", FILE_APPEND);
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'API Key inválida']);
        exit;
    }
    file_put_contents($logFile, "API Key válida\n", FILE_APPEND);
    
    // Obtener teléfono
    $telefono = isset($_GET['telefono']) ? trim($_GET['telefono']) : '';
    file_put_contents($logFile, "Teléfono recibido: '$telefono'\n", FILE_APPEND);
    
    if (empty($telefono)) {
        file_put_contents($logFile, "Teléfono vacío\n", FILE_APPEND);
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Teléfono requerido']);
        exit;
    }
    
    // Limpiar teléfono
    $telefonoLimpio = preg_replace('/[^0-9]/', '', $telefono);
    file_put_contents($logFile, "Teléfono limpio: '$telefonoLimpio'\n", FILE_APPEND);
    
    // Consultar BD
    file_put_contents($logFile, "Consultando base de datos...\n", FILE_APPEND);
    $stmt = $pdo->prepare("
        SELECT cliente, telefono, correo, pais, ciudad, direc 
        FROM ordenes 
        WHERE telefono IS NOT NULL AND telefono != ''
        ORDER BY id DESC
        LIMIT 100
    ");
    
    $stmt->execute();
    $ordenes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    file_put_contents($logFile, "Registros obtenidos: " . count($ordenes) . "\n", FILE_APPEND);
    
    $cliente = null;
    $intentos = 0;
    
    // Buscar coincidencia
    foreach ($ordenes as $orden) {
        $telefonoBD = preg_replace('/[^0-9]/', '', $orden['telefono']);
        $intentos++;
        
        file_put_contents($logFile, "Comparando:  '$telefonoLimpio' con '$telefonoBD' (original: '{$orden['telefono']}')\n", FILE_APPEND);
        
        if ($telefonoBD === $telefonoLimpio) {
            $cliente = $orden;
            file_put_contents($logFile, "¡ENCONTRADO! en intento $intentos\n", FILE_APPEND);
            break;
        }
    }
    
    file_put_contents($logFile, "Total intentos: $intentos\n", FILE_APPEND);
    
    if ($cliente) {
        $cliente['direccion'] = $cliente['direc'];
        file_put_contents($logFile, "Enviando respuesta exitosa\n", FILE_APPEND);
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $cliente,
            'message' => 'Cliente encontrado'
        ]);
    } else {
        file_put_contents($logFile, "Cliente no encontrado\n", FILE_APPEND);
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Cliente no encontrado',
            'data' => null
        ]);
    }
    
    file_put_contents($logFile, "=== FIN DEBUG ===\n\n", FILE_APPEND);
    
} catch (PDOException $e) {
    file_put_contents($logFile, "ERROR PDO: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en la base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    file_put_contents($logFile, "ERROR: " . $e->getMessage() . "\n", FILE_APPEND);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>