<?php
include_once 'config.php';

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
        throw new Exception('Método no permitido');
    }

// Obtener y validar el ID
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['clave']) || empty($data['clave'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Clave no proporcionada']);
    exit;
}



    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare("DELETE FROM afiliados WHERE clave = :clave");
    $stmt->bindParam(':clave', $data['clave'], PDO::PARAM_STR);
    $result = $stmt->execute([
        'clave' => $data['clave']
    ]);


    if ($result) {
        sendResponse(['message' => 'Fila eliminada correctamente']);
    } else {
        throw new Exception('Error al borrar los datos');
    }
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
/* 
// Validar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);
    exit;
}

// Obtener y validar el ID
$input = json_decode(file_get_contents('php://input'), true);
if (!isset($input['clave']) || empty($input['clave'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Clave no proporcionada']);
    exit;
}

$clave = $input['clave'];

try {
    $conn = new PDO("mysql:host=$servidor;dbname=$basedatos", $usuario, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Primero verificar si la franquicia existe
    $stmt = $conn->prepare("SELECT COUNT(*) FROM afiliados WHERE clave = :clave");
    $stmt->bindParam(':clave', $clave, PDO::PARAM_STR);
    $stmt->execute();
    
    if ($stmt->fetchColumn() == 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Franquicia no encontrada']);
        exit;
    }

    // Si existe, proceder con el borrado
    $stmt = $conn->prepare("DELETE FROM afiliados WHERE clave = :clave");
    $stmt->bindParam(':clave', $clave, PDO::PARAM_STR);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Franquicia eliminada correctamente']);
    } else {
        throw new Exception('Error al eliminar la franquicia');
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Error en la base de datos: ' . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
 */