<?php
// index.php (intra2/index.php)
$afiliado = $_GET['a'] ?? '';
$usuario  = $_GET['b'] ?? '';
$rol      = $_GET['c'] ?? '';
$tipo     = $_GET['d'] ?? ''; // si se usa, opcional

if (empty($afiliado) || empty($usuario)) {
    die('<h2>No hay parámetros válidos, acceso denegado.</h2>');
}

$query = 'a=' . urlencode($afiliado) . '&b=' . urlencode($usuario);
if ($rol !== '')  $query .= '&c=' . urlencode($rol);
if ($tipo !== '') $query .= '&d=' . urlencode($tipo);

if (strtoupper($afiliado) === 'CWO') {
    header('Location: registroNew/selfran.php?' . $query);
    exit;
}
header('Location: registroNew/selorden.html?' . $query);
exit;