<?php
include_once 'config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $franchise_code = $input['franchise_code'] ?? '';
    $nombre_servicio = $input['nombre_servicio'] ?? '';
    $precio_desinfeccion = $input['precio_desinfeccion'] ?? null;
    $precio_lavado = $input['precio_lavado'] ?? null;
    $precio_lavado_alt = $input['precio_lavado_alt'] ?? null;
    $data_type = $input['data_type'] ?? 'normal';

    if (empty($franchise_code) || empty($nombre_servicio)) {
        sendResponse(['error' => 'Código de franquicia y nombre de servicio requeridos'], 400);
        return;
    }

    // Obtener precio base para validación
    $stmt = $pdo->prepare("SELECT precio_desinfeccion, precio_lavado, precio_lavado_alt 
                          FROM precios_base 
                          WHERE nombre_servicio = ?");
    $stmt->execute([$nombre_servicio]);
    $basePrice = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$basePrice) {
        sendResponse(['error' => 'Servicio no encontrado en precios base'], 404);
        return;
    }

    // Validar que los precios no sean menores a los base
    if ($precio_desinfeccion !== null && $basePrice['precio_desinfeccion'] !== null && 
        $precio_desinfeccion < $basePrice['precio_desinfeccion']) {
        sendResponse(['error' => 'El precio de desinfección no puede ser menor al precio base'], 400);
        return;
    }

    if ($precio_lavado !== null && $basePrice['precio_lavado'] !== null && 
        $precio_lavado < $basePrice['precio_lavado']) {
        sendResponse(['error' => 'El precio de lavado no puede ser menor al precio base'], 400);
        return;
    }

    if ($precio_lavado_alt !== null && $basePrice['precio_lavado_alt'] !== null && 
        $precio_lavado_alt < $basePrice['precio_lavado_alt']) {
        sendResponse(['error' => 'El precio de lavado alternativo no puede ser menor al precio base'], 400);
        return;
    }

    // Verificar si ya existe el registro
    $stmt = $pdo->prepare("SELECT id FROM precios_franquicia 
                          WHERE franchise_code = ? AND nombre_servicio = ?");
    $stmt->execute([$franchise_code, $nombre_servicio]);
    $existing = $stmt->fetch();

    if ($existing) {
        // Actualizar
        $stmt = $pdo->prepare("UPDATE precios_franquicia 
                              SET precio_desinfeccion = ?, precio_lavado = ?, precio_lavado_alt = ?, data_type = ?
                              WHERE franchise_code = ? AND nombre_servicio = ?");
        $stmt->execute([$precio_desinfeccion, $precio_lavado, $precio_lavado_alt, $data_type, $franchise_code, $nombre_servicio]);
    } else {
        // Insertar
        $stmt = $pdo->prepare("INSERT INTO precios_franquicia 
                              (franchise_code, nombre_servicio, precio_desinfeccion, precio_lavado, precio_lavado_alt, data_type) 
                              VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$franchise_code, $nombre_servicio, $precio_desinfeccion, $precio_lavado, $precio_lavado_alt, $data_type]);
    }

    sendResponse(['message' => 'Precios actualizados correctamente']);
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
?>
