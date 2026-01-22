<?php
include_once 'config.php';

// Tomar afiliado desde GET (nombre de parámetro flexible)
$afiliado = $_GET['afiliado'] ?? $_GET['franquicia'] ?? '';

if (empty($afiliado)) {
    sendResponse(['error' => 'No se proporcionó una franquicia'], 400);
    exit;
}

// Listar las órdenes SOLO de esta franquicia
$stmt = $pdo->prepare("SELECT orden, franquicia, fechareg, cliente, telefono, ciudad, servicio, precio, fsolicita, fprogram, hprogram, operador, fconclu, id, creador, item, suborden 
                      FROM ordenes 
                      WHERE franquicia = ? 
                      ORDER BY orden, suborden");
$stmt->execute([$afiliado]);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
sendResponse(['data' => $result]);
?>