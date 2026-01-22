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
$headers = apache_request_headers();
$apiKey = $headers['X-API-Key'] ?? $headers['x-api-key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? null;

if ($apiKey !== 'orange-2025') {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'API Key inválida'
    ]);
    exit;
}

try {
    require_once 'db.php';
    
    // Obtener código de franquicia desde GET o POST
    $franchise_code = '';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $franchise_code = $_GET['franchise_code'] ?? '';
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $franchise_code = $input['franchise_code'] ?? '';
    }

    if (empty($franchise_code)) {
        // Si no se proporciona código de franquicia, obtener precios base
        $stmt = $pdo->prepare("SELECT 
                                  id,
                                  nombre_servicio as nombre, 
                                  precio_desinfeccion, 
                                  precio_lavado, 
                                  precio_lavado_alt, 
                                  data_type,
                                  data_type as tipo_precio_desinfeccion,
                                  data_type as tipo_precio_lavado
                              FROM precios_base 
                              ORDER BY id");
        $stmt->execute();
    } else {
        // Primero intentar obtener precios personalizados de la franquicia
        $stmt = $pdo->prepare("SELECT 
                                  id,
                                  nombre_servicio as nombre, 
                                  precio_desinfeccion, 
                                  precio_lavado, 
                                  precio_lavado_alt, 
                                  data_type,
                                  data_type as tipo_precio_desinfeccion,
                                  data_type as tipo_precio_lavado
                              FROM precios_franquicia 
                              WHERE franchise_code = ? 
                              ORDER BY id");
        $stmt->execute([$franchise_code]);
        $franchisePrices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Crear un mapa de servicios personalizados
        $customPrices = [];
        foreach ($franchisePrices as $price) {
            $customPrices[$price['nombre']] = $price;
        }

        // Obtener precios base
        $stmt = $pdo->prepare("SELECT 
                                  id,
                                  nombre_servicio as nombre, 
                                  precio_desinfeccion, 
                                  precio_lavado, 
                                  precio_lavado_alt, 
                                  data_type,
                                  data_type as tipo_precio_desinfeccion,
                                  data_type as tipo_precio_lavado
                              FROM precios_base 
                              ORDER BY id");
        $stmt->execute();
        $basePrices = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Combinar precios: usar personalizados donde existan, base donde no
        $result = [];
        foreach ($basePrices as $basePrice) {
            if (isset($customPrices[$basePrice['nombre']])) {
                $result[] = $customPrices[$basePrice['nombre']];
            } else {
                $result[] = $basePrice;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Servicios obtenidos correctamente',
            'data' => $result
        ]);
        return;
    }
    
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'message' => 'Servicios obtenidos correctamente',
        'data' => $result
    ]);
    
} catch (PDOException $e) {
    error_log("Error de base de datos en getServices.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos'
    ]);
} catch (Exception $e) {
    error_log("Error en getServices.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
}
?>
