<?php

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

const ARCHIVO_NUEVOS = __DIR__ . '/data/platillos.json';
const CATEGORIAS_VALIDAS = ['hamburguesas', 'combos', 'snacks', 'bebidas'];
const PREFIJO_IMAGENES = '../assets/images/menu/';

/**
 * Normaliza los tipos de datos devueltos por MySQL para el JSON del frontend.
 */
function formatearPlatillo(array $fila): array
{
    return [
        'id_platillo' => (int) $fila['id_platillo'],
        'id_categoria' => (int) $fila['id_categoria'],
        'categoria' => $fila['categoria'] ?? null,
        'nombre' => $fila['nombre'],
        'descripcion' => $fila['descripcion'],
        'precio' => (float) $fila['precio'],
        'imagen_url' => $fila['imagen_url'],
        'disponible' => (bool) $fila['disponible'],
        'es_promocion' => (bool) $fila['es_promocion'],
        'es_favorito' => (bool) $fila['es_favorito'],
        'orden_visualizacion' => (int) $fila['orden_visualizacion'],
        'activo' => (bool) $fila['activo'],
    ];
}

/**
 * Valida los datos de entrada según los CHECK y FK de la tabla `platillos`.
 */
function validarDatosPlatillo(PDO $pdo, array $entrada): array
{
    $idCategoria = filter_var($entrada['id_categoria'] ?? null, FILTER_VALIDATE_INT);
    if ($idCategoria === false || $idCategoria <= 0) {
        responder(['error' => 'Debes indicar una categoría válida (id_categoria)'], 422);
    }

    if (
        !is_string($entrada['nombre'] ?? null)
        || !is_string($entrada['descripcion'] ?? null)
        || !is_string($entrada['imagen_url'] ?? null)
    ) {
        responder(['error' => 'Nombre, descripción e imagen deben ser texto válido'], 422);
    }

    $nombre = trim($entrada['nombre']);
    $descripcion = trim($entrada['descripcion']);
    $imagenUrl = trim($entrada['imagen_url']);
    $precioEntrada = $entrada['precio'] ?? null;
    if (
        (!is_int($precioEntrada) && !is_float($precioEntrada) && !is_string($precioEntrada))
        || !is_numeric($precioEntrada)
    ) {
        responder(['error' => 'El precio debe ser numérico'], 422);
    }
    $precio = (float) $precioEntrada;
    $disponible = isset($entrada['disponible']) ? (bool) $entrada['disponible'] : true;
    $esPromocion = isset($entrada['es_promocion']) ? (bool) $entrada['es_promocion'] : false;
    $esFavorito = isset($entrada['es_favorito']) ? (bool) $entrada['es_favorito'] : false;
    $orden = isset($entrada['orden_visualizacion']) ? (int) $entrada['orden_visualizacion'] : 0;

    $stmtCat = $pdo->prepare('SELECT id_categoria FROM categorias WHERE id_categoria = :id AND activa = 1');
    $stmtCat->execute([':id' => $idCategoria]);
    if (!$stmtCat->fetch()) {
        responder(['error' => 'La categoría especificada no existe o está inactiva'], 422);
    }

    if (mb_strlen($nombre) < 3 || mb_strlen($nombre) > 80) {
        responder(['error' => 'El nombre debe tener entre 3 y 80 caracteres'], 422);
    }

    if ($descripcion === '' || mb_strlen($descripcion) > 250) {
        responder(['error' => 'La descripción es obligatoria y máximo de 250 caracteres'], 422);
    }

    if (!is_finite($precio) || $precio <= 0 || $precio > 99999999.99) {
        responder(['error' => 'El precio debe ser mayor a 0 y no exceder 99,999,999.99'], 422);
    }

    if ($imagenUrl === '' || mb_strlen($imagenUrl) > 255) {
        responder(['error' => 'La URL o ruta de la imagen (imagen_url) es obligatoria'], 422);
    }

    if ($orden < 0) {
        responder(['error' => 'El orden de visualización no puede ser negativo'], 422);
    }

    return [
        ':id_categoria' => $idCategoria,
        ':nombre' => $nombre,
        ':descripcion' => $descripcion,
        ':precio' => round($precio, 2),
        ':imagen_url' => $imagenUrl,
        ':disponible' => $disponible ? 1 : 0,
        ':es_promocion' => $esPromocion ? 1 : 0,
        ':es_favorito' => $esFavorito ? 1 : 0,
        ':orden_visualizacion' => $orden,
    ];
}

function buscarPlatilloPorId(PDO $pdo, int $id): ?array
{
    $sql = 'SELECT p.*, c.nombre AS categoria
            FROM platillos p
            INNER JOIN categorias c ON c.id_categoria = p.id_categoria
            WHERE p.id_platillo = :id AND p.activo = 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $id]);
    $fila = $stmt->fetch();

    return $fila ? formatearPlatillo($fila) : null;
}

switch ($metodo) {
    // =========================================================================
    // READ (GET): Todos, filtrados (?buscar= / ?categoria=) o uno (?id=)
    // =========================================================================
    case 'GET':
        if (isset($_GET['id'])) {
            $id = (int) $_GET['id'];
            $platillo = buscarPlatilloPorId($pdo, $id);
            if (!$platillo) {
                responder(['error' => 'Platillo no encontrado'], 404);
            }
            responder($platillo);
        }

        $sql = 'SELECT p.*, c.nombre AS categoria
                FROM platillos p
                INNER JOIN categorias c ON c.id_categoria = p.id_categoria
                WHERE p.activo = 1';
        $params = [];

        $buscar = trim((string) ($_GET['buscar'] ?? ''));
        if ($buscar !== '') {
            $sql .= ' AND (p.nombre LIKE :buscar_nombre OR p.descripcion LIKE :buscar_desc)';
            $params[':buscar_nombre'] = '%' . $buscar . '%';
            $params[':buscar_desc'] = '%' . $buscar . '%';
        }

        if (isset($_GET['categoria']) && (int) $_GET['categoria'] > 0) {
            $sql .= ' AND p.id_categoria = :id_categoria';
            $params[':id_categoria'] = (int) $_GET['categoria'];
        }

        $sql .= ' ORDER BY p.orden_visualizacion ASC, p.id_platillo ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $filas = $stmt->fetchAll();

        $resultado = array_map('formatearPlatillo', $filas);
        responder($resultado);
        break;

    // =========================================================================
    // CREATE (POST): Inserta un nuevo platillo en la base de datos
    // =========================================================================
    case 'POST':
        $entrada = leerJsonEntrada();
        $datos = validarDatosPlatillo($pdo, $entrada);

        $sql = 'INSERT INTO platillos (
                    id_categoria, nombre, descripcion, precio, imagen_url,
                    disponible, es_promocion, es_favorito, orden_visualizacion
                ) VALUES (
                    :id_categoria, :nombre, :descripcion, :precio, :imagen_url,
                    :disponible, :es_promocion, :es_favorito, :orden_visualizacion
                )';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($datos);

        $nuevoId = (int) $pdo->lastInsertId();
        $creado = buscarPlatilloPorId($pdo, $nuevoId);
        responder($creado, 201);
        break;

    // =========================================================================
    // UPDATE (PUT): Actualiza un platillo existente por ?id=
    // =========================================================================
    case 'PUT':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($id <= 0) {
            responder(['error' => 'Debes especificar el parámetro ?id= en la URL'], 422);
        }

        if (!buscarPlatilloPorId($pdo, $id)) {
            responder(['error' => 'Platillo no encontrado'], 404);
        }

        $entrada = leerJsonEntrada();
        $datos = validarDatosPlatillo($pdo, $entrada);
        $datos[':id_platillo'] = $id;

        $sql = 'UPDATE platillos SET
                    id_categoria = :id_categoria,
                    nombre = :nombre,
                    descripcion = :descripcion,
                    precio = :precio,
                    imagen_url = :imagen_url,
                    disponible = :disponible,
                    es_promocion = :es_promocion,
                    es_favorito = :es_favorito,
                    orden_visualizacion = :orden_visualizacion
                WHERE id_platillo = :id_platillo AND activo = 1';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($datos);

        $actualizado = buscarPlatilloPorId($pdo, $id);
        responder($actualizado, 200);
        break;

    // =========================================================================
    // DELETE (DELETE): Borrado lógico (activo = 0) para conservar historial
    // =========================================================================
    case 'DELETE':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
        if ($id <= 0) {
            responder(['error' => 'Debes especificar el parámetro ?id= en la URL'], 422);
        }

        if (!buscarPlatilloPorId($pdo, $id)) {
            responder(['error' => 'Platillo no encontrado'], 404);
        }

        $stmt = $pdo->prepare('UPDATE platillos SET activo = 0, disponible = 0 WHERE id_platillo = :id');
        $stmt->execute([':id' => $id]);

        responder([
            'mensaje' => 'Platillo eliminado correctamente del catálogo',
            'id_platillo' => $id,
        ], 200);
        break;

    default:
        header('Allow: GET, POST, PUT, DELETE');
        responder(['error' => 'Método HTTP no permitido'], 405);
}