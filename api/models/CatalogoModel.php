<?php

declare(strict_types=1);

/**
 * Modelo del dominio Catálogo (categorías y platillos).
 */
class CatalogoModel
{
    private PDO $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function listarCategorias(bool $soloActivas = true): array
    {
        $sql = 'SELECT id_categoria, nombre, orden_visualizacion, activa
                FROM categorias';
        if ($soloActivas) {
            $sql .= ' WHERE activa = 1';
        }
        $sql .= ' ORDER BY orden_visualizacion ASC, id_categoria ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute();

        return array_map([$this, 'formatearCategoria'], $stmt->fetchAll());
    }

    public function obtenerCategoriaPorId(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT id_categoria, nombre, orden_visualizacion, activa
             FROM categorias
             WHERE id_categoria = :id'
        );
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();

        return $fila ? $this->formatearCategoria($fila) : null;
    }

    public function existeCategoriaActiva(int $idCategoria): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM categorias WHERE id_categoria = :id AND activa = 1'
        );
        $stmt->execute([':id' => $idCategoria]);

        return (bool) $stmt->fetchColumn();
    }

    public function existeNombreCategoria(string $nombre, ?int $excluirId = null): bool
    {
        $sql = 'SELECT 1 FROM categorias WHERE LOWER(TRIM(nombre)) = LOWER(:nombre)';
        $params = [':nombre' => trim($nombre)];

        if ($excluirId !== null) {
            $sql .= ' AND id_categoria <> :id';
            $params[':id'] = $excluirId;
        }

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetchColumn();
    }

    public function crearCategoria(array $datos): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO categorias (nombre, orden_visualizacion, activa)
             VALUES (:nombre, :orden_visualizacion, :activa)'
        );
        $stmt->execute($datos);

        return $this->obtenerCategoriaPorId((int) $this->pdo->lastInsertId()) ?? [];
    }

    public function actualizarCategoria(int $id, array $datos): ?array
    {
        $datos[':id_categoria'] = $id;

        $stmt = $this->pdo->prepare(
            'UPDATE categorias SET
                nombre = :nombre,
                orden_visualizacion = :orden_visualizacion,
                activa = :activa
             WHERE id_categoria = :id_categoria'
        );
        $stmt->execute($datos);

        return $this->obtenerCategoriaPorId($id);
    }

    public function cambiarEstadoCategoria(int $id, bool $activa): ?array
    {
        $stmt = $this->pdo->prepare(
            'UPDATE categorias SET activa = :activa WHERE id_categoria = :id'
        );
        $stmt->execute([
            ':activa' => $activa ? 1 : 0,
            ':id' => $id,
        ]);

        return $this->obtenerCategoriaPorId($id);
    }

    public function listarPlatillos(array $filtros = []): array
    {
        $sql = 'SELECT p.*, c.nombre AS categoria, c.activa AS categoria_activa
                FROM platillos p
                INNER JOIN categorias c ON c.id_categoria = p.id_categoria
                WHERE p.activo = 1';
        $params = [];

        if (empty($filtros['incluir_categorias_inactivas'])) {
            $sql .= ' AND c.activa = 1';
        }

        $buscar = trim((string) ($filtros['buscar'] ?? ''));
        if ($buscar !== '') {
            $sql .= ' AND (p.nombre LIKE :buscar_nombre OR p.descripcion LIKE :buscar_desc)';
            $params[':buscar_nombre'] = '%' . $buscar . '%';
            $params[':buscar_desc'] = '%' . $buscar . '%';
        }

        if (isset($filtros['categoria']) && (int) $filtros['categoria'] > 0) {
            $sql .= ' AND p.id_categoria = :id_categoria';
            $params[':id_categoria'] = (int) $filtros['categoria'];
        }

        if (isset($filtros['disponible']) && ($filtros['disponible'] === '0' || $filtros['disponible'] === '1')) {
            $sql .= ' AND p.disponible = :disponible';
            $params[':disponible'] = (int) $filtros['disponible'];
        }

        $sql .= ' ORDER BY p.orden_visualizacion ASC, p.id_platillo ASC';

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);

        return array_map([$this, 'formatearPlatillo'], $stmt->fetchAll());
    }

    public function obtenerPlatilloPorId(int $id): ?array
    {
        $stmt = $this->pdo->prepare(
            'SELECT p.*, c.nombre AS categoria, c.activa AS categoria_activa
             FROM platillos p
             INNER JOIN categorias c ON c.id_categoria = p.id_categoria
             WHERE p.id_platillo = :id AND p.activo = 1'
        );
        $stmt->execute([':id' => $id]);
        $fila = $stmt->fetch();

        return $fila ? $this->formatearPlatillo($fila) : null;
    }

    public function crearPlatillo(array $datos): array
    {
        $stmt = $this->pdo->prepare(
            'INSERT INTO platillos (
                id_categoria, nombre, descripcion, precio, imagen_url,
                disponible, es_promocion, es_favorito, orden_visualizacion
            ) VALUES (
                :id_categoria, :nombre, :descripcion, :precio, :imagen_url,
                :disponible, :es_promocion, :es_favorito, :orden_visualizacion
            )'
        );
        $stmt->execute($datos);

        return $this->obtenerPlatilloPorId((int) $this->pdo->lastInsertId()) ?? [];
    }

    public function actualizarPlatillo(int $id, array $datos): ?array
    {
        $datos[':id_platillo'] = $id;

        $stmt = $this->pdo->prepare(
            'UPDATE platillos SET
                id_categoria = :id_categoria,
                nombre = :nombre,
                descripcion = :descripcion,
                precio = :precio,
                imagen_url = :imagen_url,
                disponible = :disponible,
                es_promocion = :es_promocion,
                es_favorito = :es_favorito,
                orden_visualizacion = :orden_visualizacion
            WHERE id_platillo = :id_platillo AND activo = 1'
        );
        $stmt->execute($datos);

        return $this->obtenerPlatilloPorId($id);
    }

    public function desactivarPlatillo(int $id): bool
    {
        $stmt = $this->pdo->prepare(
            'UPDATE platillos SET activo = 0, disponible = 0 WHERE id_platillo = :id AND activo = 1'
        );
        $stmt->execute([':id' => $id]);

        return $stmt->rowCount() > 0;
    }

    private function formatearCategoria(array $fila): array
    {
        return [
            'id_categoria' => (int) $fila['id_categoria'],
            'nombre' => $fila['nombre'],
            'orden_visualizacion' => (int) $fila['orden_visualizacion'],
            'activa' => (bool) $fila['activa'],
        ];
    }

    private function formatearPlatillo(array $fila): array
    {
        return [
            'id_platillo' => (int) $fila['id_platillo'],
            'id_categoria' => (int) $fila['id_categoria'],
            'categoria' => $fila['categoria'] ?? null,
            'categoria_activa' => isset($fila['categoria_activa']) ? (bool) $fila['categoria_activa'] : true,
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
}
