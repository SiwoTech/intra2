<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
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

// Solo permitir POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

try {
    // Incluir configuración de base de datos
    require_once 'db.php';
    
    // Obtener datos JSON del cuerpo de la petición
    $input = file_get_contents('php://input');
    error_log("editOrderItem.php - Input recibido: " . $input);
    
    $data = json_decode($input, true);
    
    if (!$data) {
        error_log("editOrderItem.php - Error: JSON inválido");
        throw new Exception('Datos JSON inválidos');
    }
    
    error_log("editOrderItem.php - Datos decodificados: " . print_r($data, true));
    
    // Validar campos requeridos (correo es opcional)
    $requiredFields = ['id', 'cliente', 'telefono', 'pais', 'ciudad', 'direccion', 'fsolicita', 'fprogram', 'hprogram', 'operador', 'servicio', 'precio', 'clave'];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || (is_string($data[$field]) && trim($data[$field]) === '')) {
            throw new Exception("Campo requerido faltante: $field");
        }
    }
    
    // Validar campos opcionales (correo y comentarios)
    $optionalFields = ['correo', 'comenta'];
    foreach ($optionalFields as $field) {
        if (!isset($data[$field])) {
            $data[$field] = ''; // Establecer como cadena vacía si no existe
        }
    }
    
    // Validar que el ID sea válido
    $orderId = intval($data['id']);
    if ($orderId <= 0) {
        throw new Exception('ID de orden inválido');
    }
    
    // Validar que el precio sea válido
    $precio = floatval($data['precio']);
    if ($precio < 0) {
        throw new Exception('El precio no puede ser negativo');
    }
    
    // Verificar que la orden existe y pertenece a la franquicia
    $checkStmt = $pdo->prepare("SELECT id, fconclu FROM ordenes WHERE id = ? AND franquicia = ?");
    $checkStmt->execute([$orderId, $data['clave']]);
    $existingOrder = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$existingOrder) {
        throw new Exception('Orden no encontrada o no tienes permisos para modificarla');
    }
    
    // Verificar si la orden ya está concluida
    if ($existingOrder['fconclu'] && $existingOrder['fconclu'] !== '0000-00-00 00:00:00') {
        throw new Exception('No se puede modificar una orden que ya ha sido concluida');
    }
    
    // Preparar la consulta de actualización con todos los campos de la tabla
    $sql = "UPDATE ordenes SET 
            cliente = ?,
            telefono = ?,
            correo = ?,
            pais = ?,
            ciudad = ?,
            direc = ?,
            fsolicita = ?,
            fprogram = ?,
            hprogram = ?,
            operador = ?,
            comenta = ?,
            servicio = ?,
            precio = ?
            WHERE id = ? AND franquicia = ?";
    
    $stmt = $pdo->prepare($sql);
    
    // Ejecutar la actualización
    $result = $stmt->execute([
        trim($data['cliente']),
        trim($data['telefono']),
        trim($data['correo']),
        $data['pais'],
        trim($data['ciudad']),
        trim($data['direccion']),
        $data['fsolicita'],
        $data['fprogram'],
        $data['hprogram'],
        trim($data['operador']),
        trim($data['comenta']),
        trim($data['servicio']),
        $precio,
        $orderId,
        $data['clave']
    ]);
    
    if (!$result) {
        throw new Exception('Error al actualizar la orden en la base de datos');
    }
    
    // Verificar que se actualizó al menos una fila
    if ($stmt->rowCount() === 0) {
        throw new Exception('No se pudo actualizar la orden. Verifique que los datos sean diferentes a los actuales.');
    }
    
    // Respuesta exitosa
    echo json_encode([
        'success' => true,
        'message' => 'Orden modificada exitosamente',
        'data' => [
            'id' => $orderId,
            'rowsAffected' => $stmt->rowCount()
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Error de base de datos en editOrderItem.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    error_log("Error en editOrderItem.php: " . $e->getMessage());
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
?>
