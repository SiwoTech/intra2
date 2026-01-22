<?php
include_once 'config.php';

try {
    // Verificar método HTTP
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        throw new Exception('Método no permitido');
    }

    // Obtener datos del body
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!$data) {
        throw new Exception('Datos inválidos');
    }

    // Validar campos requeridos
    $requiredFields = ['clave', 'nombre', 'ciudad', 'celular', 'correo'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Campo requerido faltante: {$field}");
        }
    }

    // Preparar y ejecutar la consulta de inserción
    $stmt = $pdo->prepare("INSERT INTO afiliados (clave, nombre, ciudad, celular, correo) VALUES (:clave, :nombre, :ciudad, :celular, :correo)");

    $result = $stmt->execute([
        'clave' => $data['clave'],
        'nombre' => $data['nombre'],
        'ciudad' => $data['ciudad'],
        'celular' => $data['celular'],
        'correo' => $data['correo']
    ]);

    if ($result) {
        sendResponse(['message' => 'Franquicia creada correctamente']);
    } else {
        throw new Exception('Error al crear la franquicia');
    }
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}