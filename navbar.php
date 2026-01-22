<style>
/* Barra de navegación pill/tab moderna */
.menu-navbar {
  background: #f7f9fb;
  padding: 0.4em 1.2em;
  border-radius: 12px;
  width: 98%;
  margin: 0.8em auto 2em auto;
  box-shadow: 0 2px 8px rgba(60,70,120,0.05);
  max-width: 1200px;
}
.menu-navbar ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 16px;
}
.menu-navbar li {
  margin: 0;
  padding: 0;
}
.menu-navbar a {
  display: block;
  padding: 0.48em 1.35em;
  font-size: 1.11rem;
  color: #6b7280;
  background: transparent;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.menu-navbar a.active, .menu-navbar a:focus, .menu-navbar a:active {
  background: #fff;
  color: #6b7280;
  font-weight: 700;
  box-shadow: 0 1px 4px rgba(140, 140, 170, 0.04);
}
.menu-navbar a:hover {
  background: #f2f4f8;
  color: #222;
}
@media (max-width: 700px) {
  .menu-navbar ul { gap: 6px; }
  .menu-navbar a { font-size: 1em; padding: 0.38em 0.7em; }
}
</style>

<nav class="menu-navbar">
  <ul class="menu">
    <li><a href="index.php" class="active">Agenda</a></li>
    <li><a href="produccion_diaria.php">Producción Diaria</a></li>
    <li>
      <a href="../intra2/index.php?a=<?php echo urlencode($current_afiliado); ?>&b=<?php echo urlencode($current_user); ?><?php echo isset($current_rol1) && $current_rol1 !== '' ? '&c=' . urlencode($current_rol1) : ''; ?>">
        Órdenes
      </a>
    </li>
    <li><a href="concluir_ordenes.php">Concluir órdenes</a></li>
    <li><a href="seccion_caja.php">Caja</a></li>
    <li><a href="desglose_mensual.php">Desglose mensual</a></li>
    <li><a href="comisiones_rango.php">Comisiones</a></li>
  </ul>
</nav>