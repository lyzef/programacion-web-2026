<?php

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    responder(['error' => 'Método HTTP no permitido'], 405);
}

$pdo = conectar();
$stmt = $pdo->prepare(
    'SELECT id_categoria, nombre
     FROM categorias
     WHERE activa = 1
     ORDER BY orden_visualizacion ASC, id_categoria ASC'
);
$stmt->execute();

responder($stmt->fetchAll());
