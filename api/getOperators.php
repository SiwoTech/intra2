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
    
    // Obtener parámetros
    $franquicia = '';
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $franquicia = $_GET['franquicia'] ?? '';
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $franquicia = $input['franquicia'] ?? '';
    }

    if (empty($franquicia)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'El parámetro franquicia es obligatorio'
        ]);
        exit;
    }

    // Conectar a la base de datos secundaria
    $pdo = Conexion();
    
    // Buscar operadores de la franquicia específica, ordenados alfabéticamente
    $stmt = $pdo->prepare("SELECT 
                            id,
                            afiliado,
                            nombre,
                            status
                          FROM operadores 
                          WHERE afiliado = ? AND status = 0
                          ORDER BY nombre ASC");
    $stmt->execute([$franquicia]);
    $operators = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Procesar los datos para el formato deseado
    $processedOperators = [];
    foreach ($operators as $operator) {
        $processedOperators[] = [
            'id' => $operator['id'],
            'afiliado' => $operator['afiliado'],
            'nombre' => $operator['nombre'],
            'status' => $operator['status'],
            'display_text' => $operator['id'] . ' - ' . $operator['nombre'] . ' (' . $operator['afiliado'] . ')'
        ];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Operadores obtenidos correctamente',
        'data' => $processedOperators,
        'total' => count($processedOperators),
        'franquicia' => $franquicia
    ]);
    
} catch (PDOException $e) {
    error_log("Error de base de datos en getOperators.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos'
    ]);
} catch (Exception $e) {
    error_log("Error en getOperators.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor'
    ]);
}
?>
