<?php
// dbOrdenes.php: Conexión a la base de datos secundaria para órdenes
function Conexion(){
    $conn = null;
    $host = '127.0.0.1';
    $db = 'u826340212_orangedb';
    $user = 'u826340212_orangedb';
    $pwr = 'Cwo9982061148';
    
    try {
        $conn = new PDO('mysql:host='.$host.';dbname='.$db.';charset=utf8', $user, $pwr);
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch(PDOException $e) {
        error_log('Error al conectar la base de datos secundaria: ' . $e->getMessage());
        throw new Exception('Error de conexión a la base de datos');
    }
    
    return $conn;
}
?>
