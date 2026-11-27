<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/models/CatalogoModel.php';

function validarDatosPlatillo(CatalogoModel $catalogo, array $entrada): array
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

    if (!$catalogo->existeCategoriaActiva($idCategoria)) {
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

function obtenerIdObligatorio(): int
{
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;
    if ($id <= 0) {
        responder(['error' => 'Debes especificar el parámetro ?id= en la URL'], 422);
    }

    return $id;
}

$metodo = validarMetodo(['GET', 'POST', 'PUT', 'DELETE']);

try {
    $catalogo = new CatalogoModel(conectar());
} catch (Throwable $error) {
    error_log('No se pudo conectar a la base de datos desde platillos.php: ' . $error->getMessage());
    responder(['error' => 'No se pudo conectar con la base de datos. Revisa api/config.php.'], 500);
}

switch ($metodo) {
    case 'GET':
        if (isset($_GET['id'])) {
            $platillo = $catalogo->obtenerPlatilloPorId((int) $_GET['id']);
            if (!$platillo) {
                responder(['error' => 'Platillo no encontrado'], 404);
            }
            responder($platillo);
        }

        responder($catalogo->listarPlatillos([
            'buscar' => $_GET['buscar'] ?? '',
            'categoria' => $_GET['categoria'] ?? null,
            'disponible' => $_GET['disponible'] ?? null,
            'incluir_categorias_inactivas' => ($_GET['incluir_categorias_inactivas'] ?? '') === '1',
        ]));
        break;

    case 'POST':
        $datos = validarDatosPlatillo($catalogo, leerJsonEntrada());
        responder($catalogo->crearPlatillo($datos), 201);
        break;

    case 'PUT':
        $id = obtenerIdObligatorio();
        if (!$catalogo->obtenerPlatilloPorId($id)) {
            responder(['error' => 'Platillo no encontrado'], 404);
        }

        $datos = validarDatosPlatillo($catalogo, leerJsonEntrada());
        responder($catalogo->actualizarPlatillo($id, $datos), 200);
        break;

    case 'DELETE':
        $id = obtenerIdObligatorio();
        if (!$catalogo->desactivarPlatillo($id)) {
            responder(['error' => 'Platillo no encontrado'], 404);
        }

        responder([
            'mensaje' => 'Platillo eliminado correctamente del catálogo',
            'id_platillo' => $id,
        ], 200);
        break;
}
