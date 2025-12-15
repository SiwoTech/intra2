<?php
include_once 'config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    $franchise_code = $input['franchise_code'] ?? '';

    if (empty($franchise_code)) {
        sendResponse(['error' => 'Código de franquicia requerido'], 400);
        return;
    }

    // Primero intentar obtener precios personalizados de la franquicia
    $stmt = $pdo->prepare("SELECT nombre_servicio, precio_desinfeccion, precio_lavado, precio_lavado_alt, data_type 
                          FROM precios_franquicia 
                          WHERE franchise_code = ? 
                          ORDER BY id");
    $stmt->execute([$franchise_code]);
    $franchisePrices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Crear un mapa de servicios personalizados
    $customPrices = [];
    foreach ($franchisePrices as $price) {
        $customPrices[$price['nombre_servicio']] = $price;
    }

    // Obtener precios base
    $stmt = $pdo->prepare("SELECT nombre_servicio, precio_desinfeccion, precio_lavado, precio_lavado_alt, data_type 
                          FROM precios_base 
                          ORDER BY id");
    $stmt->execute();
    $basePrices = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Combinar precios: usar personalizados donde existan, base donde no
    $finalPrices = [];
    foreach ($basePrices as $basePrice) {
        if (isset($customPrices[$basePrice['nombre_servicio']])) {
            $finalPrices[] = $customPrices[$basePrice['nombre_servicio']];
        } else {
            $finalPrices[] = $basePrice;
        }
    }

    sendResponse(['data' => $finalPrices]);
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
?>
