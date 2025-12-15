<?php
include_once 'config.php';

try {
    // Obtener parámetros del usuario
    $username = $_GET['username'] ?? $_POST['username'] ?? '';
    $user_type = $_GET['user_type'] ?? $_POST['user_type'] ?? '';
    $user_franchise = $_GET['user_franchise'] ?? $_POST['user_franchise'] ?? '';
    
    // Si no se proporcionan los datos del usuario, obtenerlos del endpoint getUserInfo
    if (empty($username) || empty($user_type) || empty($user_franchise)) {
        sendResponse(['error' => 'Datos de usuario requeridos: username, user_type, user_franchise'], 400);
        return;
    }

    // Determinar si el usuario es administrador
    $user_tipo_lower = strtolower($user_type);
    $is_admin = in_array($user_tipo_lower, ['admin', 'prb']);
    
    if ($is_admin) {
        // Si es admin, mostrar todas las franquicias
        $stmt = $pdo->query("SELECT id, clave, nombre, ciudad, celular, correo, fultimo FROM afiliados ORDER BY nombre ASC");
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Si no es admin, mostrar solo la franquicia a la que está afiliado
        $stmt = $pdo->prepare("SELECT id, clave, nombre, ciudad, celular, correo, fultimo FROM afiliados WHERE clave = ?");
        $stmt->execute([$user_franchise]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    sendResponse([
        'success' => true,
        'data' => $result,
        'user_info' => [
            'username' => $username,
            'type' => $user_type,
            'franchise' => $user_franchise,
            'is_admin' => $is_admin,
            'total_franchises' => count($result)
        ]
    ]);
    
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}