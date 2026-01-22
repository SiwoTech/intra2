<?php
include_once 'config.php';

try {
    // Obtener código de franquicia desde GET o POST
    $franchise_code = '';
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $franchise_code = $_GET['franchise_code'] ?? '';
    } else {
        $input = json_decode(file_get_contents('php://input'), true);
        $franchise_code = $input['franchise_code'] ?? '';
    }

    if (empty($franchise_code)) {
        error_log("getNextOrderNumber: Código de franquicia vacío");
        sendResponse(['error' => 'Código de franquicia requerido'], 400);
        return;
    }

    error_log("getNextOrderNumber: Procesando franquicia: " . $franchise_code);

    // Obtener el último número de orden para esta franquicia específica
    // Mismo query que en createOrder.php
    $stmt = $pdo->prepare("SELECT MAX(CAST(SUBSTRING(orden, LENGTH(?) + 1) AS UNSIGNED)) as ultimo_numero 
                          FROM ordenes 
                          WHERE franquicia = ? AND orden LIKE CONCAT(?, '%')");
    $stmt->execute([$franchise_code, $franchise_code, $franchise_code]);
    $result_orden = $stmt->fetch(PDO::FETCH_ASSOC);
    
    error_log("getNextOrderNumber: Resultado query orden: " . json_encode($result_orden));
    
    // Si no hay órdenes previas, empezar desde 1, si no, incrementar
    $ultimo_numero = $result_orden['ultimo_numero'] ? intval($result_orden['ultimo_numero']) : 0;
    $nuevo_numero = $ultimo_numero + 1;
    
    // Generar el código con padding de 5 dígitos
    $proximo_codigo = $franchise_code . str_pad($nuevo_numero, 5, '0', STR_PAD_LEFT);

    error_log("getNextOrderNumber: Último número: $ultimo_numero, Nuevo número: $nuevo_numero, Próximo código: $proximo_codigo");

    // También obtener el último folio (item)
    $stmt = $pdo->prepare("SELECT fultimo FROM afiliados WHERE clave = ?");
    $stmt->execute([$franchise_code]);
    $result_folio = $stmt->fetch(PDO::FETCH_ASSOC);
    
    error_log("getNextOrderNumber: Resultado query folio: " . json_encode($result_folio));
    
    if (!$result_folio) {
        error_log("getNextOrderNumber: Franquicia no encontrada: " . $franchise_code);
        sendResponse(['error' => 'Franquicia no encontrada'], 404);
        return;
    }

    $proximo_item = intval($result_folio['fultimo']) + 1;

    $response_data = [
        'proximo_codigo_orden' => $proximo_codigo,
        'proximo_numero' => $nuevo_numero,
        'proximo_item' => $result_folio['fultimo'], // El item actual que se usará
        'franchise_code' => $franchise_code
    ];

    error_log("getNextOrderNumber: Respuesta final: " . json_encode($response_data));

    sendResponse([
        'message' => 'Próximo número de orden generado',
        'data' => $response_data
    ]);

} catch (Exception $e) {
    error_log("getNextOrderNumber ERROR: " . $e->getMessage());
    error_log("getNextOrderNumber TRACE: " . $e->getTraceAsString());
    sendResponse(['error' => $e->getMessage()], 500);
}
?>
