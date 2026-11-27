<?php

function responder($datos, int $codigo = 200): void
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE);
    exit;
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