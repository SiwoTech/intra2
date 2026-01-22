<?php
include_once 'config.php';

try {
    // Obtener el nombre de usuario desde la query string o POST
    $username = $_GET['username'] ?? $_POST['username'] ?? '';
    
    if (empty($username)) {
        sendResponse(['error' => 'Nombre de usuario requerido'], 400);
        return;
    }

    // Buscar el usuario en la base de datos por la concatenación nombre + ' ' + apellido
    $stmt = $pdo->prepare("
        SELECT id, afiliado, nombre, apellido, nivel, nivel_desc
        FROM participantes
        WHERE CONCAT(nombre, ' ', apellido) = ?
    ");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        sendResponse(['error' => 'Usuario no encontrado'], 404);
        return;
    }

    // Determinar si el usuario es administrador
    $user_tipo = strtolower($user['nivel_desc']);
    $is_admin = in_array($user_tipo, ['admin', 'prb']);
    
    // Preparar la respuesta
    $response_data = [
        'id' => $user['id'],
        'afiliado' => $user['afiliado'],
        'nombre' => trim($user['nombre'] . ' ' . $user['apellido']),
        'nivel' => $user['nivel'],
        'tipo' => $user['nivel_desc'],
        'is_admin' => $is_admin
    ];

    sendResponse([
        'success' => true,
        'message' => 'Información de usuario obtenida exitosamente',
        'data' => $response_data
    ]);

} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
?>