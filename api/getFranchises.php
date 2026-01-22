<?php
include_once 'config.php';
require_once 'db_aff.php';

try {
    // Obtener parámetros del usuario, incluyendo rol/nivel
    $username      = $_GET['username']      ?? $_POST['username']      ?? '';
    $user_type     = $_GET['user_type']     ?? $_POST['user_type']     ?? '';
    $user_franchise= $_GET['user_franchise']?? $_POST['user_franchise']?? '';
    $user_role     = $_GET['user_role']     ?? $_POST['user_role']     ?? '';
	
    // Si no se proporcionan los datos del usuario, error
    if (empty($username) || empty($user_franchise)) {
        sendResponse(['error' => 'Datos de usuario requeridos: username, user_franchise'], 400);
        return;
    }
	

    // Normaliza valores
    $user_tipo_lower = strtolower($user_type);
    $nivel_admines = [10]; // Puedes agregar otros niveles aquí si así lo requieres (ej: 11, 12, etc)
    $user_role_int = intval($user_role);

    // Es admin si user_type textual es admin/prb o si el nivel es numérico admin (ej: 10)
    $is_admin = ($user_tipo_lower === 'administrator' || $user_tipo_lower === 'prb' || in_array($user_role_int, $nivel_admines) || $user_franchise === 'CWO');

    if ($is_admin) {
        // Si es admin, mostrar todas las franquicias
        $stmt = $pdo_aff->query("SELECT id, clave, nombre, ciudad, celular, correo, fultimo FROM afiliados ORDER BY CASE WHEN clave = 'CWO' THEN 1 WHEN clave LIKE '%MODULO%' THEN 2 ELSE 3 END, nombre ASC");
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } else {
        // Si no es admin, mostrar solo la franquicia a la que está afiliado
        $stmt = $pdo_aff->prepare("SELECT id, clave, nombre, ciudad, celular, correo, fultimo FROM afiliados WHERE clave = ?");
        $stmt->execute([$user_franchise]);
        $result = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    sendResponse([
        'success' => true,
        'data' => $result,
        'user_info' => [
            'username'        => $username,
            'type'            => $user_type,
            'franchise'       => $user_franchise,
            'role'            => $user_role,
            'is_admin'        => $is_admin,
            'total_franchises'=> count($result)
        ]
    ]);
    
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
?>