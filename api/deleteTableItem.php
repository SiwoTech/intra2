<?php
include_once 'config.php';

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }

    // Obtener y validar los datos
    $data = json_decode(file_get_contents('php://input'), true);

    if (!isset($data['table']) || empty($data['table'])) {
        throw new Exception('Tabla no especificada');
    }

    if (!isset($data['id']) || empty($data['id'])) {
        throw new Exception('ID no proporcionado');
    }

    $table = $data['table'];
    $id = $data['id'];

    // Validar tabla permitida por seguridad
    $allowedTables = ['afiliados', 'ordenes', 'franquicias'];
    if (!in_array($table, $allowedTables)) {
        throw new Exception('Tabla no permitida');
    }

    // Determinar la columna de ID según la tabla
    $idColumn = 'id'; // Por defecto
    if ($table === 'afiliados') {
        $idColumn = 'clave';
    }

    // Preparar y ejecutar la consulta
    $sql = "DELETE FROM {$table} WHERE {$idColumn} = :id";
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute(['id' => $id]);

    if ($result && $stmt->rowCount() > 0) {
        sendResponse(['message' => 'Elemento eliminado correctamente']);
    } else {
        throw new Exception('No se encontró el elemento para eliminar');
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