<?php
function conectar(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    $archivoConfig = __DIR__ . '/config.php';
    if (!is_file($archivoConfig)) {
        throw new RuntimeException('No existe api/config.php; copia config.example.php y configura las credenciales.');
    }

    $config = require $archivoConfig;
    $dsn = "mysql:host={$config['host']};"
         . "dbname={$config['db']};charset=utf8mb4";

    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}