<?php
include_once 'config.php';

// Solo permitir GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendResponse([
        'success' => false,
        'message' => 'Método no permitido'
    ], 405);
    exit;
}

try {
    // Debug: Log de parámetros recibidos
    error_log("getOrderDetails.php - ID: " . ($_GET['id'] ?? 'null') . ", Franquicia: " . ($_GET['franquicia'] ?? 'null'));
    
    // Obtener parámetros
    $orderId = $_GET['id'] ?? null;
    $franquicia = $_GET['franquicia'] ?? null;
    
    if (!$orderId) {
        sendResponse([
            'success' => false,
            'message' => 'ID de orden requerido'
        ], 400);
        exit;
    }
    
    if (!$franquicia) {
        sendResponse([
            'success' => false,
            'message' => 'Franquicia requerida'
        ], 400);
        exit;
    }
    
    // Consulta para obtener todos los detalles de la orden
    $sql = "SELECT 
                id,
                orden,
                item,
                suborden,
                cliente,
                telefono,
                correo,
                pais,
                ciudad,
                direc as direccion,
                fsolicita,
                fprogram,
                hprogram,
                operador,
                comenta,
                servicio,
                precio,
                franquicia,
                fconclu
            FROM ordenes 
            WHERE id = ? AND franquicia = ?";
    
    // Debug: Log del SQL y parámetros
    error_log("getOrderDetails.php - SQL: " . $sql);
    error_log("getOrderDetails.php - Parámetros: ID=" . $orderId . ", Franquicia=" . $franquicia);
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$orderId, $franquicia]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Debug: Log del resultado
    error_log("getOrderDetails.php - Resultado: " . ($order ? "encontrado" : "no encontrado"));
    if ($order) {
        error_log("getOrderDetails.php - Datos: " . json_encode($order));
    }
    
    if (!$order) {
        sendResponse([
            'success' => false,
            'message' => 'Orden no encontrada o no tienes permisos para verla'
        ], 404);
        exit;
    }
    
    // Formatear fechas si existen
    if ($order['fsolicita'] && $order['fsolicita'] !== '0000-00-00') {
        $order['fsolicita'] = date('Y-m-d', strtotime($order['fsolicita']));
    } else {
        $order['fsolicita'] = null;
    }
    
    if ($order['fprogram'] && $order['fprogram'] !== '0000-00-00') {
        $order['fprogram'] = date('Y-m-d', strtotime($order['fprogram']));
    } else {
        $order['fprogram'] = null;
    }
    
    // Formatear hora si existe
    if ($order['hprogram'] && $order['hprogram'] !== '00:00:00') {
        $order['hprogram'] = date('H:i', strtotime($order['hprogram']));
    } else {
        $order['hprogram'] = null;
    }
    
    // Convertir precio a float
    $order['precio'] = floatval($order['precio']);
    
    // Determinar estado
    $order['estado'] = $order['fconclu'] && $order['fconclu'] !== '0000-00-00 00:00:00' ? 'Concluida' : 'Pendiente';
    
    // Respuesta exitosa
    sendResponse([
        'success' => true,
        'message' => 'Orden encontrada',
        'data' => $order
    ]);
    
} catch (PDOException $e) {
    error_log("Error de base de datos en getOrderDetails.php: " . $e->getMessage());
    sendResponse([
        'success' => false,
        'message' => 'Error de base de datos: ' . $e->getMessage()
    ], 500);
} catch (Exception $e) {
    error_log("Error en getOrderDetails.php: " . $e->getMessage());
    sendResponse([
        'success' => false,
        'message' => $e->getMessage()
    ], 400);
}
?>
