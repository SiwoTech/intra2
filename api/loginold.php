<?php
// Evitar que PHP muestre errores en la salida
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Asegurar que la respuesta sea siempre JSON
header('Content-Type: application/json');

require_once 'config.php';

// Log de inicio de solicitud
error_log('Solicitud de login recibida');

// Verificar si es una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error_log('Método no permitido: ' . $_SERVER['REQUEST_METHOD']);
    sendResponse(['success' => false, 'message' => 'Método no permitido'], 405);
}

// Obtener datos del cuerpo de la petición
$input = file_get_contents('php://input');
error_log('Datos recibidos: ' . $input);
$data = json_decode($input, true);

if (!isset($data['username']) || !isset($data['password'])) {
    error_log('Datos incompletos en la solicitud');
    sendResponse(['success' => false, 'message' => 'Datos incompletos'], 400);
}

$username = $data['username'];
$password = $data['password'];

try {
    if (!$pdo) {
        error_log('Error: No hay conexión a la base de datos');
        sendResponse([
            'success' => false,
            'message' => 'Error de conexión a la base de datos'
        ], 500);
        return;
    }

    // Consultar usuario en la base de datos
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE nombre = ?");
    if (!$stmt) {
        error_log('Error en la preparación de la consulta: ' . print_r($pdo->errorInfo(), true));
        sendResponse([
            'success' => false,
            'message' => 'Error en la consulta'
        ], 500);
        return;
    }

    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    error_log('Búsqueda de usuario completada');
    
    // Para depuración: imprimir los datos del usuario (sin la contraseña)
    $userDebug = $user ? array_merge($user, ['password' => '[OCULTO]']) : null;
    error_log('Datos del usuario encontrado: ' . print_r($userDebug, true));

    // Verificar si la contraseña está en texto plano temporalmente
    if ($user && ($password === $user['password'] || password_verify($password, $user['password']))) {
        error_log('Login exitoso para usuario: ' . $username);
        // Login exitoso
        $response = [
            'success' => true,
            'username' => $user['nombre'],
            'franquicia' => $user['afiliado'],
            'nivel' => $user['nivel'],
            'tipo' => $user['tipo']
        ];
        error_log('Enviando respuesta: ' . print_r($response, true));
        sendResponse($response);
    } else {
        error_log('Login fallido para usuario: ' . $username);
        // Login fallido
        sendResponse([
            'success' => false,
            'message' => 'Usuario o contraseña incorrectos'
        ], 401);
    }
} catch (PDOException $e) {
    error_log('Error en login: ' . $e->getMessage());
    sendResponse([
        'success' => false,
        'message' => 'Error al procesar la solicitud: ' . $e->getMessage()
    ], 500);
}
?>
