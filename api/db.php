<?php

declare(strict_types=1);

/**
 * Devuelve una conexión PDO compartida (patrón Singleton).
 */
function conectar(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $archivoConfig = __DIR__ . '/config.php';
    if (!is_file($archivoConfig)) {
        throw new RuntimeException(
            'No existe api/config.php; copia config.example.php y configura las credenciales.'
        );
    }

    $config = require $archivoConfig;
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        $config['host'],
        $config['db']
    );

    $pdo = new PDO($dsn, $config['user'], $config['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}
