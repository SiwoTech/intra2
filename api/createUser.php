<?php
include_once 'config.php';

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $franchise_code = $input['franchise_code'] ?? '';
    $cliente = $input['cliente'] ?? '';
    $correo = $input['correo'] ?? '';
    $telefono = $input['telefono'] ?? '';
    $pais = $input['pais'] ?? '';
    $ciudad = $input['ciudad'] ?? '';
    $direccion = $input['direccion'] ?? '';
    $fsolicita = $input['fsolicita'] ?? '';
    $fprogram = $input['fprogram'] ?? '';
    $hora = $input['hora'] ?? '';
    $operador = $input['operador'] ?? '';
    $comentarios = $input['comentarios'] ?? '';
    $servicios = $input['servicios'] ?? [];
    $creador = $input['creador'] ?? '';
    $fuente = $input['fuente'] ?? 'Ventas';

    // Validar datos requeridos
    if (empty($franchise_code) || empty($cliente) || empty($servicios)) {
        sendResponse(['error' => 'Datos incompletos: se requiere código de franquicia, cliente y servicios'], 400);
        return;
    }

    // Limpiar teléfono (remover espacios como en el sistema antiguo)
    $telefono_limpio = str_replace(' ', '', $telefono);

    // Generar código único de orden por franquicia
    // Formato: (clave_franquicia)(numero_secuencial_5_digitos)
    // Ejemplo: CWO00001, CWO00002, etc.
    
    // Obtener el último número de orden para esta franquicia específica
    $stmt = $pdo->prepare("SELECT MAX(CAST(SUBSTRING(orden, LENGTH(?) + 1) AS UNSIGNED)) as ultimo_numero 
                          FROM ordenes 
                          WHERE franquicia = ? AND orden LIKE CONCAT(?, '%')");
    $stmt->execute([$franchise_code, $franchise_code, $franchise_code]);
    $result_orden = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Si no hay órdenes previas, empezar desde 1, si no, incrementar
    $ultimo_numero = $result_orden['ultimo_numero'] ? intval($result_orden['ultimo_numero']) : 0;
    $nuevo_numero = $ultimo_numero + 1;
    
    // Generar el código con padding de 5 dígitos
    $codigo_orden = $franchise_code . str_pad($nuevo_numero, 5, '0', STR_PAD_LEFT);

    // Obtener el último folio de la franquicia (igual que en el sistema antiguo)
    $stmt = $pdo->prepare("SELECT fultimo FROM afiliados WHERE clave = ?");
    $stmt->execute([$franchise_code]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$result) {
        sendResponse(['error' => 'Franquicia no encontrada'], 404);
        return;
    }

    $ultimo_folio = intval($result['fultimo']); // Este es el $datos del sistema antiguo
    $nuevo_folio = $ultimo_folio + 1; // Este es el $nf del sistema antiguo

    // Iniciar transacción
    $pdo->beginTransaction();

    try {
        $suborden_counter = 1; // Contador para suborden (igual que $cont en sistema antiguo)
        $orden_ids = [];

        // Insertar cada servicio como un registro separado (igual que el loop en sistema antiguo)
        foreach ($servicios as $servicio) {
            // Usar fullName si está disponible, si no usar name
            $nombre_servicio = $servicio['fullName'] ?? $servicio['name'] ?? '';
            $precio_servicio = floatval($servicio['price'] ?? 0);
            $tipo_servicio = $servicio['type'] ?? '';
            
            if (empty($nombre_servicio) || $precio_servicio <= 0) {
                continue; // Saltar servicios inválidos
            }

            // Obtener las primeras 3 letras del servicio para sertipo (igual que $jk = substr($p, 0, 3))
            $sertipo = substr($nombre_servicio, 0, 3);

            // Insertar con la misma estructura que el sistema antiguo
            $stmt = $pdo->prepare("INSERT INTO ordenes (
                franquicia, cliente, correo, telefono, pais, ciudad, direc, 
                fsolicita, fprogram, hprogram, operador, servicio, precio, comenta, 
                orden, item, suborden, sertipo, creador, fuente
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

            $result = $stmt->execute([
                $franchise_code,     // franquicia ($q)
                $cliente,           // cliente ($e) 
                $correo,            // correo ($r)
                $telefono_limpio,   // telefono ($tlim)
                $pais,              // pais ($y)
                $ciudad,            // ciudad ($u)
                $direccion,         // direc ($i)
                $fsolicita,         // fsolicita ($o)
                $fprogram,          // fprogram (nuevo campo)
                $hora,              // hora (nuevo campo)
                $operador,          // operador (nuevo campo)
                $nombre_servicio,   // servicio ($p)
                $precio_servicio,   // precio ($ppd - ya convertido a float)
                $comentarios,       // comenta ($s)
                $codigo_orden,      // orden (nuevo código único por franquicia)
                $ultimo_folio,      // item ($datos - folio actual de la franquicia)
                $suborden_counter,  // suborden ($sb - contador secuencial)
                $sertipo,           // sertipo ($jk - primeras 3 letras)
                $creador,           // creador ($cr)
                $fuente             // fuente ($fu)
            ]);

            if ($result) {
                $orden_ids[] = $pdo->lastInsertId();
                $suborden_counter++; // Incrementar suborden para el siguiente servicio
            }
        }

        // Actualizar el último folio en la tabla afiliados (igual que en sistema antiguo)
        $stmt = $pdo->prepare("UPDATE afiliados SET fultimo = ? WHERE clave = ?");
        $stmt->execute([$nuevo_folio, $franchise_code]);

        // Confirmar transacción
        $pdo->commit();

        sendResponse([
            'message' => 'Orden creada exitosamente',
            'data' => [
                'codigo_orden' => $codigo_orden,
                'numero_orden' => $nuevo_numero,
                'item' => $ultimo_folio,
                'total_servicios' => count($orden_ids),
                'orden_ids' => $orden_ids,
                'nuevo_folio' => $nuevo_folio
            ]
        ]);

    } catch (Exception $e) {
        // Revertir transacción en caso de error
        $pdo->rollback();
        throw $e;
    }

} catch (Exception $e) {
    sendResponse(['error' => $e->getMessage()], 500);
}
?>
