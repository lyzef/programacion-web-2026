<?php

require __DIR__ . '/helpers.php';

const ARCHIVO_NUEVOS = __DIR__ . '/data/platillos.json';
const CATEGORIAS_VALIDAS = ['hamburguesas', 'combos', 'snacks', 'bebidas'];
const PREFIJO_IMAGENES = '../assets/images/menu/';

function obtenerPlatillos(): array
{
    $iniciales = require __DIR__ . '/data/platillos_iniciales.php';
    return array_merge($iniciales, leerNuevos());
}

function leerNuevos(): array
{
    if (!file_exists(ARCHIVO_NUEVOS)) {
        return [];
    }
    $datos = json_decode((string) file_get_contents(ARCHIVO_NUEVOS), true);
    return is_array($datos) ? $datos : [];
}

function longitud(string $texto): int
{
    return (int) preg_match_all('/./su', $texto);
}

function minusculas(string $texto): string
{
    return function_exists('mb_strtolower') ? mb_strtolower($texto) : strtolower($texto);
}

function validarPlatillo($datos): array
{
    $errores = [];

    if (!is_array($datos)) {
        return ['cuerpo' => 'El cuerpo de la petición debe ser un JSON válido.'];
    }

    $nombre = isset($datos['nombre']) && is_string($datos['nombre']) ? trim($datos['nombre']) : '';
    if ($nombre === '') {
        $errores['nombre'] = 'El nombre es obligatorio.';
    } elseif (longitud($nombre) < 3 || longitud($nombre) > 80) {
        $errores['nombre'] = 'El nombre debe tener entre 3 y 80 caracteres.';
    } else {
        foreach (obtenerPlatillos() as $existente) {
            if (minusculas($existente['nombre']) === minusculas($nombre)) {
                $errores['nombre'] = 'Ya existe un platillo con ese nombre.';
                break;
            }
        }
    }

    $descripcion = isset($datos['descripcion']) && is_string($datos['descripcion']) ? trim($datos['descripcion']) : '';
    if ($descripcion === '') {
        $errores['descripcion'] = 'La descripción es obligatoria.';
    } elseif (longitud($descripcion) < 10 || longitud($descripcion) > 250) {
        $errores['descripcion'] = 'La descripción debe tener entre 10 y 250 caracteres.';
    }

    if (!isset($datos['precio']) || !is_numeric($datos['precio'])) {
        $errores['precio'] = 'El precio es obligatorio y debe ser un número.';
    } elseif ((float) $datos['precio'] <= 0 || (float) $datos['precio'] >= 10000) {
        $errores['precio'] = 'El precio debe ser mayor a 0 y menor a 10,000.';
    }

    if (!isset($datos['categoria']) || !in_array($datos['categoria'], CATEGORIAS_VALIDAS, true)) {
        $errores['categoria'] = 'La categoría debe ser: ' . implode(', ', CATEGORIAS_VALIDAS) . '.';
    }

    $imagen = isset($datos['imagen']) && is_string($datos['imagen']) ? trim($datos['imagen']) : '';
    if ($imagen === '') {
        $errores['imagen'] = 'La imagen es obligatoria.';
    } elseif (strpos($imagen, PREFIJO_IMAGENES) !== 0 || strpos($imagen, '..') !== false || strlen($imagen) > 255) {
        $errores['imagen'] = 'La imagen debe estar en ' . PREFIJO_IMAGENES;
    }

    return $errores;
}

function guardarPlatillo(array $datos): array
{
    $archivo = fopen(ARCHIVO_NUEVOS, 'c+');
    if ($archivo === false || !flock($archivo, LOCK_EX)) {
        responder(500, ['error' => 'No se pudo guardar el platillo.']);
    }

    $nuevos = json_decode((string) stream_get_contents($archivo), true);
    $nuevos = is_array($nuevos) ? $nuevos : [];

    $ultimoId = 0;
    foreach (array_merge(require __DIR__ . '/data/platillos_iniciales.php', $nuevos) as $platillo) {
        $ultimoId = max($ultimoId, $platillo['id']);
    }

    $platillo = [
        'id' => $ultimoId + 1,
        'nombre' => trim($datos['nombre']),
        'precio' => round((float) $datos['precio'], 2),
        'descripcion' => trim($datos['descripcion']),
        'categoria' => $datos['categoria'],
        'imagen' => trim($datos['imagen']),
    ];
    $nuevos[] = $platillo;

    ftruncate($archivo, 0);
    rewind($archivo);
    fwrite($archivo, json_encode($nuevos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    fflush($archivo);
    flock($archivo, LOCK_UN);
    fclose($archivo);

    return $platillo;
}

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'GET') {
    $platillos = obtenerPlatillos();

    if (!isset($_GET['id'])) {
        responder(200, $platillos);
    }

    $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
    foreach ($platillos as $platillo) {
        if ($id !== false && $platillo['id'] === $id) {
            responder(200, $platillo);
        }
    }
    responder(404, ['error' => 'No existe un platillo con el id indicado.']);
}

if ($metodo === 'POST') {
    $datos = json_decode((string) file_get_contents('php://input'), true);
    $errores = validarPlatillo($datos);

    if ($errores) {
        responder(422, [
            'error' => implode(' ', $errores),
            'errores' => $errores,
        ]);
    }

    responder(201, guardarPlatillo($datos));
}

header('Allow: GET, POST');
responder(405, ['error' => 'Método no permitido. Usa GET o POST.']);
