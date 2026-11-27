<?php

declare(strict_types=1);

function responder($datos, int $codigo = 200): void
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
}

function validarMetodo(array $permitidos): string
{
    $metodo = $_SERVER['REQUEST_METHOD'] ?? '';
    if (!in_array($metodo, $permitidos, true)) {
        header('Allow: ' . implode(', ', $permitidos));
        responder(['error' => 'Método HTTP no permitido'], 405);
    }

    return $metodo;
}

function leerJsonEntrada(): array
{
    $cuerpo = file_get_contents('php://input');
    if ($cuerpo === false || trim($cuerpo) === '') {
        return [];
    }

    $datos = json_decode($cuerpo, true);
    if (!is_array($datos)) {
        responder(['error' => 'El cuerpo de la petición no contiene un JSON válido'], 400);
    }

    return $datos;
}
