<?php
// db_aff.php: Conexión a la base de datos afiliados (franquicias)
$host_aff = '31.170.167.52';
$dbname_aff = 'u826340212_orangeintra2';
$user_aff = 'u826340212_orangeintra2';
$password_aff = 'Cwo9982061148';

try {
    $pdo_aff = new PDO("mysql:host=$host_aff;dbname=$dbname_aff;charset=utf8mb4", $user_aff, $password_aff);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Error al conectar a la base de datos afiliados: ' . $e->getMessage()]);
    exit;
}
?>