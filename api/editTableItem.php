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
    $requiredFields = ['id', 'clave', 'nombre', 'ciudad', 'celular', 'correo'];
    foreach ($requiredFields as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Campo requerido faltante: {$field}");
        }
    }

    // Preparar y ejecutar la consulta
    $stmt = $pdo->prepare("UPDATE afiliados SET 
        clave = :clave,
        nombre = :nombre,
        ciudad = :ciudad,
        celular = :celular,
        correo = :correo
        WHERE id = :id");

    $result = $stmt->execute([
        'id' => $data['id'],
        'clave' => $data['clave'],
        'nombre' => $data['nombre'],
        'ciudad' => $data['ciudad'],
        'celular' => $data['celular'],
        'correo' => $data['correo']
    ]);

    if ($result) {
        sendResponse(['message' => 'Actualizado correctamente']);
    } else {
        throw new Exception('Error al actualizar los datos');
    }
} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}