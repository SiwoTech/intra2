<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-API-Key');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Validar API Key
require_once 'auth.php';
if (!validateApiKey()) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'API Key inválida'
    ]);
    exit;
}

try {
    require_once 'dbOrdenes.php';
    
    // Obtener parámetros desde GET o POST
    $orden = '';
    $suborden = '';
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $orden = $_GET['orden'] ?? '';
        $suborden = $_GET['suborden'] ?? '';
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $orden = $input['orden'] ?? '';
        $suborden = $input['suborden'] ?? '';
    }

    if (empty($orden) || empty($suborden)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Los parámetros orden y suborden son obligatorios'
        ]);
        exit;
    }

    // Conectar a la base de datos secundaria
    $pdo = Conexion();
    
    // Buscar la orden en la tabla ordenes
    $stmt = $pdo->prepare("SELECT 
                            pseudocliente,
                            claveservicio,
                            numoper,
                            fechaarriv,
                            idmaquina,
                            tiempo,
                            recibe,
                            origen
                          FROM ordenes 
                          WHERE orden = ? AND suborden = ?");
    $stmt->execute([$orden, $suborden]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result) {
        // Procesar los datos para mostrar "No disponible" cuando esté vacío
        $processedResult = [];
        foreach ($result as $key => $value) {
            if (empty($value) || $value === null || $value === '') {
                $processedResult[$key] = 'No disponible';
            } else {
                // Formatear fecha si es necesario
                if ($key === 'fechaarriv' && $value !== 'No disponible') {
                    $date = new DateTime($value);
                    $processedResult[$key] = $date->format('d/m/Y H:i:s');
                } else {
                    $processedResult[$key] = $value;
                }
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Orden encontrada',
            'data' => $processedResult,
            'search_params' => [
                'orden' => $orden,
                'suborden' => $suborden
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'No se encontró registro para la orden ' . $orden . ' y suborden ' . $suborden,
            'data' => null,
            'search_params' => [
                'orden' => $orden,
                'suborden' => $suborden
            ]
        ]);
    }
    
} catch (PDOException $e) {
    error_log("Error de base de datos en lookForOrder.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos'
    ]);
} catch (Exception $e) {
    error_log("Error en lookForOrder.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
}
?>