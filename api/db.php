<?php
// db.php: Conexión a la base de datos MySQL
$host = '31.170.167.52';
$dbname = 'u826340212_orangeintra2';
$user = 'u826340212_orangeintra2';
$password = 'Cwo9982061148';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error al conectar a la base de datos: " . $e->getMessage());
}
?>
