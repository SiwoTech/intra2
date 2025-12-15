<?php
include_once 'config.php';

try {
    // Get franchise ID from query parameter
    $fs = isset($_GET['franquicia']) ? $_GET['franquicia'] : '';
    
    if (empty($fs)) {
        sendResponse(['error' => 'No se proporcionó una franquicia'], 400);
        exit;
    }
    
    $stmt = $pdo->prepare("SELECT orden, franquicia, fechareg, cliente, telefono, ciudad, servicio, precio, fsolicita, fprogram, hprogram, operador, fconclu, id, creador, item, suborden 
                          FROM ordenes 
                          WHERE franquicia = ? 
                          ORDER BY orden, suborden");
    
    $stmt->execute([$fs]);
    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(['data' => $result]);
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
