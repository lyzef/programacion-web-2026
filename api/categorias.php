<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/models/CatalogoModel.php';

function validarDatosCategoria(CatalogoModel $catalogo, array $entrada, ?int $excluirId = null): array
{
    if (!is_string($entrada['nombre'] ?? null)) {
        responder(['error' => 'El nombre de la categoría debe ser texto válido'], 422);
    }

    $nombre = trim($entrada['nombre']);
    if (mb_strlen($nombre) < 2 || mb_strlen($nombre) > 60) {
        responder(['error' => 'El nombre de la categoría debe tener entre 2 y 60 caracteres'], 422);
    }

    $ordenEntrada = $entrada['orden_visualizacion'] ?? 0;
    $orden = filter_var($ordenEntrada, FILTER_VALIDATE_INT);
    if ($orden === false || $orden < 0) {
        responder(['error' => 'El orden de visualización debe ser un número entero mayor o igual a 0'], 422);
    }

    if ($catalogo->existeNombreCategoria($nombre, $excluirId)) {
        responder(['error' => 'Ya existe una categoría con ese nombre'], 422);
    }

    $activa = isset($entrada['activa']) ? (bool) $entrada['activa'] : true;

    return [
        ':nombre' => $nombre,
        ':orden_visualizacion' => $orden,
        ':activa' => $activa ? 1 : 0,
    ];
}

function obtenerIdCategoriaObligatorio(): int
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
    error_log('No se pudo conectar a la base de datos desde categorias.php: ' . $error->getMessage());
    responder(['error' => 'No se pudo conectar con la base de datos. Revisa api/config.php.'], 500);
}

switch ($metodo) {
    case 'GET':
        if (isset($_GET['id'])) {
            $categoria = $catalogo->obtenerCategoriaPorId((int) $_GET['id']);
            if (!$categoria) {
                responder(['error' => 'Categoría no encontrada'], 404);
            }
            responder($categoria);
        }

        $soloActivas = ($_GET['todas'] ?? '') !== '1';
        responder($catalogo->listarCategorias($soloActivas));
        break;

    case 'POST':
        $datos = validarDatosCategoria($catalogo, leerJsonEntrada());
        responder($catalogo->crearCategoria($datos), 201);
        break;

    case 'PUT':
        $id = obtenerIdCategoriaObligatorio();
        if (!$catalogo->obtenerCategoriaPorId($id)) {
            responder(['error' => 'Categoría no encontrada'], 404);
        }

        $datos = validarDatosCategoria($catalogo, leerJsonEntrada(), $id);
        responder($catalogo->actualizarCategoria($id, $datos), 200);
        break;

    case 'DELETE':
        $id = obtenerIdCategoriaObligatorio();
        if (!$catalogo->obtenerCategoriaPorId($id)) {
            responder(['error' => 'Categoría no encontrada'], 404);
        }

        $desactivada = $catalogo->cambiarEstadoCategoria($id, false);
        responder([
            'mensaje' => 'Categoría desactivada correctamente',
            'categoria' => $desactivada,
        ], 200);
        break;
}
