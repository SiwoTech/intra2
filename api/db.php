<?php
// db.php: Conexión a la base de datos MySQL
$host = '31.170.167.52';
$dbname = 'u826340212_SUSER';
$user = 'u826340212_suserclient';
$password = 'Cwo9982061148';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password);
    // ... otras configuraciones PDO
} catch (PDOException $e) {
    // CRÍTICO: responde en formato JSON
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error al conectar a la base de datos: ' . $e->getMessage()]);
    exit;
}
?>