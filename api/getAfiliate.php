<?php
include_once 'config.php';

try {
    // Obtener el parámetro id (opcional)
    $idp = isset($_GET['id']) ? $_GET['id'] : null;

    if ($idp && $idp > 0) {
        $stmt = $pdo->prepare("SELECT id, clave, nombre, ciudad, celular, correo, fultimo FROM afiliados WHERE id = ?");
        $stmt->execute([$idp]);
    } else {
        $stmt = $pdo->query("SELECT id, clave, nombre, ciudad, celular, correo, fultimo FROM afiliados");
    }

    $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    sendResponse(['data' => $result]);
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}