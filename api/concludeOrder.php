<?php
include_once 'config.php';

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }

    // Obtener y validar los datos
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception('ID de orden no proporcionado');
    }

    if (!isset($data['operador']) || $data['operador'] === '') {
        throw new Exception('Operador es obligatorio');
    }

    if (!isset($data['nombreRecibe']) || empty($data['nombreRecibe'])) {
        // El nombre de quien recibe es opcional, usar nombre del cliente por defecto
        $nombreRecibe = 'No especificado';
    } else {
        $nombreRecibe = $data['nombreRecibe'];
    }

    if (!isset($data['fconclu']) || empty($data['fconclu'])) {
        throw new Exception('Fecha de conclusión es obligatoria');
    }

    $orderId = $data['id'];
    $operador = $data['operador'];
    $fconclu = $data['fconclu'];
    $concluida = isset($data['concluida']) ? $data['concluida'] : 1;

    // Verificar que la orden existe y no está ya concluida
    $checkStmt = $pdo->prepare("SELECT id, fconclu FROM ordenes WHERE id = :id");
    $checkStmt->execute(['id' => $orderId]);
    $order = $checkStmt->fetch(PDO::FETCH_ASSOC);

    if (!$order) {
        throw new Exception('Orden no encontrada');
    }

    // Verificar si ya está concluida
    if ($order['fconclu'] && $order['fconclu'] !== '0000-00-00 00:00:00' && $order['fconclu'] !== '') {
        throw new Exception('Esta orden ya está marcada como concluida');
    }

    // Preparar y ejecutar la actualización
    // Solo actualizar los campos que sabemos que existen
    $sql = "UPDATE ordenes SET 
            operador = :operador, 
            fconclu = :fconclu 
            WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        'operador' => $operador,
        'fconclu' => $fconclu,
        'id' => $orderId
    ]);

    if ($result && $stmt->rowCount() > 0) {
        sendResponse([
            'message' => 'Orden marcada como concluida exitosamente',
            'data' => [
                'id' => $orderId,
                'fconclu' => $fconclu,
                'operador' => $operador,
                'nombreRecibe' => $nombreRecibe
            ]
        ]);
    } else {
        throw new Exception('No se pudo actualizar la orden');
    }

} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
