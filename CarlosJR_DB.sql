DROP DATABASE IF EXISTS carlos_jr;
CREATE DATABASE carlos_jr
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE carlos_jr;
-- ============================================================================
-- 1. USUARIOS Y DIRECCIÓN ÚNICA EDITABLE (1 dirección por usuario)
-- ============================================================================
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    correo VARCHAR(120) NOT NULL UNIQUE,
    telefono CHAR(10) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'cocinero', 'repartidor', 'administrador') NOT NULL DEFAULT 'cliente',
    estado ENUM('activo', 'suspendido') NOT NULL DEFAULT 'activo',
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_usuarios_nombre CHECK (CHAR_LENGTH(TRIM(nombre_completo)) >= 3),
    CONSTRAINT chk_usuarios_telefono CHECK (telefono REGEXP '^[0-9]{10}$'),
    INDEX idx_usuarios_rol_estado (rol, estado)
);
CREATE TABLE direcciones_entrega (
    id_direccion INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    direccion_completa VARCHAR(255) NOT NULL,
    referencias VARCHAR(150) NULL,
    telefono_contacto CHAR(10) NOT NULL,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_direccion_usuario UNIQUE (id_usuario),
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    CONSTRAINT chk_dir_texto CHECK (CHAR_LENGTH(TRIM(direccion_completa)) >= 10),
    CONSTRAINT chk_dir_telefono CHECK (telefono_contacto REGEXP '^[0-9]{10}$')
);
-- ============================================================================
-- 2. CATÁLOGO DEL MENÚ (Platillos y extras)
-- ============================================================================
CREATE TABLE categorias (
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL UNIQUE,
    orden_visualizacion INT NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_categorias_orden CHECK (orden_visualizacion >= 0)
);
CREATE TABLE platillos (
    id_platillo INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nombre VARCHAR(80) NOT NULL,
    descripcion VARCHAR(250) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    imagen_url VARCHAR(255) NOT NULL,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    es_promocion BOOLEAN NOT NULL DEFAULT FALSE,
    es_favorito BOOLEAN NOT NULL DEFAULT FALSE,
    orden_visualizacion INT NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria) ON DELETE RESTRICT,
    CONSTRAINT chk_platillos_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 3),
    CONSTRAINT chk_platillos_descripcion CHECK (CHAR_LENGTH(TRIM(descripcion)) > 0),
    CONSTRAINT chk_platillos_imagen CHECK (CHAR_LENGTH(TRIM(imagen_url)) > 0),
    CONSTRAINT chk_platillos_precio CHECK (precio > 0),
    CONSTRAINT chk_platillos_orden CHECK (orden_visualizacion >= 0),
    INDEX idx_platillos_catalogo (activo, disponible, id_categoria)
);
CREATE TABLE extras_platillo (
    id_extra INT AUTO_INCREMENT PRIMARY KEY,
    id_platillo INT NOT NULL,
    nombre VARCHAR(60) NOT NULL,
    precio_adicional DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    disponible BOOLEAN NOT NULL DEFAULT TRUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (id_platillo) REFERENCES platillos(id_platillo) ON DELETE RESTRICT,
    CONSTRAINT chk_extras_nombre CHECK (CHAR_LENGTH(TRIM(nombre)) >= 2),
    CONSTRAINT chk_extras_precio CHECK (precio_adicional >= 0),
    INDEX idx_extras_platillo (id_platillo, activo, disponible)
);
-- ============================================================================
-- 3. PARÁMETROS FIJOS, SECUENCIA DE FOLIOS Y HORARIOS
-- ============================================================================
CREATE TABLE configuracion_sistema (
    id_config TINYINT PRIMARY KEY DEFAULT 1,
    tiempo_estimado_minutos INT NOT NULL DEFAULT 67,
    umbral_retraso_minutos INT NOT NULL DEFAULT 30,
    costo_envio_fijo DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
    CONSTRAINT chk_config_singleton CHECK (id_config = 1),
    CONSTRAINT chk_config_valores CHECK (
        tiempo_estimado_minutos > 0
        AND umbral_retraso_minutos > 0
        AND costo_envio_fijo >= 0
    )
);
CREATE TABLE secuencia_folios (
    id_seq TINYINT PRIMARY KEY DEFAULT 1,
    ultimo_numero INT NOT NULL DEFAULT 0,
    CONSTRAINT chk_seq_singleton CHECK (id_seq = 1),
    CONSTRAINT chk_seq_valor CHECK (ultimo_numero >= 0)
);
CREATE TABLE horarios_atencion (
    id_horario INT AUTO_INCREMENT PRIMARY KEY,
    dia_semana ENUM('lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo') NOT NULL UNIQUE,
    hora_apertura TIME NOT NULL,
    hora_cierre TIME NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT chk_horario_rango CHECK (hora_cierre > hora_apertura)
);
-- ============================================================================
-- 4. PEDIDOS Y TRAZABILIDAD
-- ============================================================================
CREATE TABLE pedidos (
    id_pedido INT AUTO_INCREMENT PRIMARY KEY,
    folio VARCHAR(25) NOT NULL DEFAULT '' UNIQUE,
    id_usuario INT NOT NULL,
    id_direccion INT NULL,
    direccion_entrega_texto VARCHAR(255) NOT NULL,
    referencias_entrega VARCHAR(150) NULL,
    telefono_contacto CHAR(10) NOT NULL,
    notas_entrega VARCHAR(150) NULL,
    metodo_pago ENUM('efectivo', 'transferencia') NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    costo_envio DECIMAL(10, 2) NOT NULL DEFAULT 35.00,
    total DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado') NOT NULL DEFAULT 'pendiente',
    motivo_cancelacion VARCHAR(200) NULL,
    id_usuario_ultimo_cambio INT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_entrega_estimada DATETIME NOT NULL,
    fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_direccion) REFERENCES direcciones_entrega(id_direccion) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario_ultimo_cambio) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    CONSTRAINT chk_pedidos_direccion CHECK (CHAR_LENGTH(TRIM(direccion_entrega_texto)) >= 10),
    CONSTRAINT chk_pedidos_telefono CHECK (telefono_contacto REGEXP '^[0-9]{10}$'),
    CONSTRAINT chk_pedidos_montos CHECK (
        subtotal > 0
        AND costo_envio >= 0
        AND total = subtotal + costo_envio
    ),
    CONSTRAINT chk_pedidos_cancelacion CHECK (
        (estado <> 'cancelado' AND motivo_cancelacion IS NULL)
        OR (
            estado = 'cancelado'
            AND motivo_cancelacion IS NOT NULL
            AND CHAR_LENGTH(TRIM(motivo_cancelacion)) BETWEEN 5 AND 200
        )
    ),
    INDEX idx_pedidos_estado_fecha (estado, fecha_creacion),
    INDEX idx_pedidos_pago_fecha (metodo_pago, fecha_creacion),
    INDEX idx_pedidos_usuario_fecha (id_usuario, fecha_creacion)
);
CREATE TABLE detalle_pedidos (
    id_detalle INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_platillo INT NOT NULL,
    nombre_platillo_historico VARCHAR(80) NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario_historico DECIMAL(10, 2) NOT NULL,
    notas_cocina VARCHAR(150) NULL,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_platillo) REFERENCES platillos(id_platillo) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_cantidad CHECK (cantidad BETWEEN 1 AND 20),
    CONSTRAINT chk_detalle_precio CHECK (precio_unitario_historico > 0),
    INDEX idx_detalle_pedido (id_pedido),
    INDEX idx_detalle_platillo (id_platillo)
);
CREATE TABLE detalle_pedido_extras (
    id_detalle_extra INT AUTO_INCREMENT PRIMARY KEY,
    id_detalle INT NOT NULL,
    id_extra INT NOT NULL,
    nombre_extra_historico VARCHAR(60) NOT NULL,
    precio_adicional_historico DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT uq_detalle_extra UNIQUE (id_detalle, id_extra),
    FOREIGN KEY (id_detalle) REFERENCES detalle_pedidos(id_detalle) ON DELETE CASCADE,
    FOREIGN KEY (id_extra) REFERENCES extras_platillo(id_extra) ON DELETE RESTRICT,
    CONSTRAINT chk_detalle_extra_precio CHECK (precio_adicional_historico >= 0),
    INDEX idx_detalle_extras_detalle (id_detalle)
);
CREATE TABLE historial_estados_pedido (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido INT NOT NULL,
    id_usuario_responsable INT NOT NULL,
    estado_anterior ENUM('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado') NULL,
    estado_nuevo ENUM('pendiente', 'preparando', 'en_camino', 'entregado', 'cancelado') NOT NULL,
    observacion VARCHAR(200) NULL,
    fecha_cambio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario_responsable) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT,
    INDEX idx_historial_pedido_fecha (id_pedido, fecha_cambio)
);
-- ============================================================================
-- 5. TRIGGERS DE FOLIO AUTOMÁTICO, DISPONIBILIDAD, TRAZABILIDAD Y ROLES
-- ============================================================================
DELIMITER //
CREATE TRIGGER trg_usuarios_before_update
BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    DECLARE v_admins_activos INT DEFAULT 0;
    IF OLD.rol = 'administrador' AND OLD.estado = 'activo'
       AND (NEW.rol <> 'administrador' OR NEW.estado <> 'activo') THEN
        SELECT COUNT(*) INTO v_admins_activos
        FROM usuarios
        WHERE rol = 'administrador' AND estado = 'activo' AND id_usuario <> OLD.id_usuario;
        IF v_admins_activos = 0 THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No se puede suspender ni degradar al único administrador activo del sistema.';
        END IF;
    END IF;
END//
CREATE TRIGGER trg_pedidos_before_insert
BEFORE INSERT ON pedidos
FOR EACH ROW
BEGIN
    DECLARE v_eta_min INT DEFAULT 67;
    DECLARE v_envio DECIMAL(10, 2) DEFAULT 35.00;
    DECLARE v_seq INT DEFAULT 0;
    DECLARE v_rol VARCHAR(20);
    DECLARE v_estado_usuario VARCHAR(20);
    DECLARE v_dir_owner INT;
    SELECT rol, estado INTO v_rol, v_estado_usuario
    FROM usuarios
    WHERE id_usuario = NEW.id_usuario;
    IF v_rol <> 'cliente' OR v_estado_usuario <> 'activo' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo un usuario con rol cliente y estado activo puede confirmar pedidos.';
    END IF;
    IF NEW.subtotal <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El subtotal debe ser mayor a 0 y abarcar al menos un producto.';
    END IF;
    IF NEW.id_direccion IS NOT NULL THEN
        SELECT id_usuario INTO v_dir_owner FROM direcciones_entrega WHERE id_direccion = NEW.id_direccion;
        IF v_dir_owner IS NULL OR v_dir_owner <> NEW.id_usuario THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'La dirección seleccionada no pertenece al usuario.';
        END IF;
    END IF;
    SELECT tiempo_estimado_minutos, costo_envio_fijo INTO v_eta_min, v_envio
    FROM configuracion_sistema
    WHERE id_config = 1;
    UPDATE secuencia_folios
    SET ultimo_numero = ultimo_numero + 1
    WHERE id_seq = 1;
    SELECT ultimo_numero INTO v_seq
    FROM secuencia_folios
    WHERE id_seq = 1;
    IF NEW.fecha_creacion IS NULL THEN
        SET NEW.fecha_creacion = CURRENT_TIMESTAMP;
    END IF;
    SET NEW.folio = CONCAT('CJR-', DATE_FORMAT(NEW.fecha_creacion, '%Y%m%d'), '-', LPAD(v_seq, 5, '0'));
    SET NEW.estado = 'pendiente';
    SET NEW.motivo_cancelacion = NULL;
    SET NEW.costo_envio = v_envio;
    SET NEW.total = NEW.subtotal + NEW.costo_envio;
    SET NEW.fecha_entrega_estimada = DATE_ADD(NEW.fecha_creacion, INTERVAL v_eta_min MINUTE);
    SET NEW.id_usuario_ultimo_cambio = NEW.id_usuario;
END//
CREATE TRIGGER trg_pedidos_after_insert
AFTER INSERT ON pedidos
FOR EACH ROW
BEGIN
    INSERT INTO historial_estados_pedido (
        id_pedido, id_usuario_responsable, estado_anterior, estado_nuevo, observacion
    ) VALUES (
        NEW.id_pedido, NEW.id_usuario, NULL, NEW.estado, 'Pedido registrado en Checkout'
    );
END//
CREATE TRIGGER trg_detalle_pedidos_before_insert
BEFORE INSERT ON detalle_pedidos
FOR EACH ROW
BEGIN
    DECLARE v_activo BOOLEAN DEFAULT FALSE;
    DECLARE v_disponible BOOLEAN DEFAULT FALSE;
    SELECT activo, disponible INTO v_activo, v_disponible
    FROM platillos
    WHERE id_platillo = NEW.id_platillo;
    IF v_activo <> TRUE OR v_disponible <> TRUE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo se pueden ordenar platillos activos y disponibles.';
    END IF;
END//
CREATE TRIGGER trg_detalle_extras_before_insert
BEFORE INSERT ON detalle_pedido_extras
FOR EACH ROW
BEGIN
    DECLARE v_extra_platillo INT;
    DECLARE v_detalle_platillo INT;
    DECLARE v_activo BOOLEAN DEFAULT FALSE;
    DECLARE v_disponible BOOLEAN DEFAULT FALSE;
    SELECT id_platillo INTO v_detalle_platillo
    FROM detalle_pedidos
    WHERE id_detalle = NEW.id_detalle;
    SELECT id_platillo, activo, disponible INTO v_extra_platillo, v_activo, v_disponible
    FROM extras_platillo
    WHERE id_extra = NEW.id_extra;
    IF v_activo <> TRUE OR v_disponible <> TRUE THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solo se pueden incluir extras activos y disponibles.';
    END IF;
    IF v_extra_platillo <> v_detalle_platillo THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'El extra seleccionado no corresponde al platillo del pedido.';
    END IF;
END//
CREATE TRIGGER trg_pedidos_before_update
BEFORE UPDATE ON pedidos
FOR EACH ROW
BEGIN
    DECLARE v_rol VARCHAR(20);
    DECLARE v_estado_usuario VARCHAR(20);
    IF OLD.estado <> NEW.estado THEN
        IF OLD.estado IN ('entregado', 'cancelado') THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'No se puede modificar el estado de un pedido entregado o cancelado.';
        END IF;
        IF NEW.estado <> 'cancelado' AND NOT (
            (OLD.estado = 'pendiente' AND NEW.estado = 'preparando')
            OR (OLD.estado = 'preparando' AND NEW.estado = 'en_camino')
            OR (OLD.estado = 'en_camino' AND NEW.estado = 'entregado')
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Los pedidos solo pueden transicionar hacia adelante paso a paso o cancelarse.';
        END IF;
        IF NEW.id_usuario_ultimo_cambio IS NULL THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Debe especificarse id_usuario_ultimo_cambio para auditar la transición.';
        END IF;
        SELECT rol, estado INTO v_rol, v_estado_usuario
        FROM usuarios
        WHERE id_usuario = NEW.id_usuario_ultimo_cambio;
        IF v_estado_usuario <> 'activo' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Un usuario suspendido no puede modificar el estado de un pedido.';
        END IF;
        IF NEW.estado = 'cancelado' AND v_rol <> 'administrador' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Solo el rol administrador puede cancelar pedidos.';
        END IF;
        IF NEW.estado <> 'cancelado' THEN
            SET NEW.motivo_cancelacion = NULL;
        END IF;
        IF v_rol = 'cocinero' THEN
            IF NOT (
                (OLD.estado = 'pendiente' AND NEW.estado = 'preparando')
                OR (OLD.estado = 'preparando' AND NEW.estado = 'en_camino')
            ) THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Transición no permitida para el rol cocinero.';
            END IF;
        END IF;
        IF v_rol = 'repartidor' THEN
            IF NOT (OLD.estado = 'en_camino' AND NEW.estado = 'entregado') THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'El repartidor solo puede confirmar pedidos en estado en_camino hacia entregado.';
            END IF;
        END IF;
        IF v_rol = 'cliente' THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'El rol cliente no tiene permisos para cambiar el estado de un pedido.';
        END IF;
    END IF;
END//
CREATE TRIGGER trg_pedidos_after_update
AFTER UPDATE ON pedidos
FOR EACH ROW
BEGIN
    IF OLD.estado <> NEW.estado THEN
        INSERT INTO historial_estados_pedido (
            id_pedido, id_usuario_responsable, estado_anterior, estado_nuevo, observacion
        ) VALUES (
            NEW.id_pedido,
            NEW.id_usuario_ultimo_cambio,
            OLD.estado,
            NEW.estado,
            IF(NEW.estado = 'cancelado', NEW.motivo_cancelacion, NULL)
        );
    END IF;
END//
DELIMITER ;
-- ============================================================================
-- 6. VISTAS SQL 
-- ============================================================================
CREATE OR REPLACE VIEW vw_pedidos_monitoreo AS
SELECT
    p.id_pedido,
    p.folio,
    p.id_usuario,
    u.nombre_completo AS nombre_cliente,
    p.direccion_entrega_texto,
    p.referencias_entrega,
    p.telefono_contacto,
    p.notas_entrega,
    p.metodo_pago,
    p.subtotal,
    p.costo_envio,
    p.total,
    p.estado,
    p.motivo_cancelacion,
    p.fecha_creacion,
    p.fecha_entrega_estimada,
    TIMESTAMPDIFF(MINUTE, p.fecha_creacion, NOW()) AS minutos_transcurridos,
    CASE
        WHEN p.estado NOT IN ('entregado', 'cancelado')
             AND TIMESTAMPDIFF(MINUTE, p.fecha_creacion, NOW()) >= c.umbral_retraso_minutos
        THEN TRUE
        ELSE FALSE
    END AS esta_retrasado
FROM pedidos p
INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
CROSS JOIN configuracion_sistema c;
CREATE OR REPLACE VIEW vw_ventas_entregadas AS
SELECT
    p.id_pedido,
    p.folio,
    p.id_usuario,
    u.nombre_completo AS nombre_cliente,
    p.metodo_pago,
    p.subtotal,
    p.costo_envio,
    p.total,
    p.fecha_creacion
FROM pedidos p
INNER JOIN usuarios u ON u.id_usuario = p.id_usuario
WHERE p.estado = 'entregado';
CREATE OR REPLACE VIEW vw_ingresos_por_platillo AS
SELECT
    p.id_pedido,
    p.fecha_creacion,
    p.metodo_pago,
    dp.id_detalle,
    dp.id_platillo,
    dp.nombre_platillo_historico,
    dp.cantidad,
    dp.precio_unitario_historico,
    COALESCE(ex.total_extras_unitario, 0.00) AS extras_unitario_historico,
    dp.cantidad * (dp.precio_unitario_historico + COALESCE(ex.total_extras_unitario, 0.00)) AS ingreso_linea_con_extras
FROM pedidos p
INNER JOIN detalle_pedidos dp ON dp.id_pedido = p.id_pedido
LEFT JOIN (
    SELECT id_detalle, SUM(precio_adicional_historico) AS total_extras_unitario
    FROM detalle_pedido_extras
    GROUP BY id_detalle
) ex ON ex.id_detalle = dp.id_detalle
WHERE p.estado = 'entregado';
-- ============================================================================
-- 7. CARGA INICIAL DE CATÁLOGOS Y PARÁMETROS FIJOS DEL SISTEMA
-- ============================================================================
INSERT INTO configuracion_sistema (id_config, tiempo_estimado_minutos, umbral_retraso_minutos, costo_envio_fijo)
VALUES (1, 67, 30, 35.00);
INSERT INTO secuencia_folios (id_seq, ultimo_numero)
VALUES (1, 0);
INSERT INTO categorias (nombre, orden_visualizacion) VALUES
    ('Hamburguesas', 1),
    ('Combos', 2),
    ('Snacks / Acompañamientos', 3),
    ('Bebidas', 4);
INSERT INTO platillos (
    id_platillo, id_categoria, nombre, descripcion, precio, imagen_url, orden_visualizacion
) VALUES
    (1, (SELECT id_categoria FROM categorias WHERE nombre = 'Hamburguesas'), 'Paceña', 'Carne a la parrilla, queso, aguacate y salsa de la casa.', 99.00, '/assets/images/menu/clasico-con-papas-2.jpg', 1),
    (2, (SELECT id_categoria FROM categorias WHERE nombre = 'Hamburguesas'), 'Psicologa', 'Doble carne, tocino crujiente, queso y salsa BBQ.', 115.00, '/assets/images/menu/clasico-con-papas-2.jpg', 2),
    (3, (SELECT id_categoria FROM categorias WHERE nombre = 'Hamburguesas'), 'Doblecarne', 'Dos carnes, queso amarillo, cebolla y aderezo especial.', 129.00, '/assets/images/menu/clasica-con-papas.jpg', 3),
    (4, (SELECT id_categoria FROM categorias WHERE nombre = 'Combos'), 'Combo clasico', 'Hamburguesa clásica, papas doradas y bebida.', 159.00, '/assets/images/menu/clasica-con-papas.jpg', 4),
    (5, (SELECT id_categoria FROM categorias WHERE nombre = 'Combos'), 'Combo Familiar', 'Cuatro hamburguesas, cuatro papas y cuatro bebidas.', 399.00, '/assets/images/menu/combo-familiar.png', 5),
    (6, (SELECT id_categoria FROM categorias WHERE nombre = 'Combos'), 'Combo Pareja', 'Dos hamburguesas, papas grandes y dos bebidas.', 219.00, '/assets/images/menu/combo-familiar.png', 6),
    (7, (SELECT id_categoria FROM categorias WHERE nombre = 'Snacks / Acompañamientos'), 'Papas con Queso', 'Papas crujientes con queso fundido y un toque de especias.', 57.00, '/assets/images/menu/papas-480w.webp', 7),
    (8, (SELECT id_categoria FROM categorias WHERE nombre = 'Snacks / Acompañamientos'), 'Aros de Cebolla', 'Aros dorados y crujientes, recién preparados.', 49.00, '/assets/images/menu/papas-480w.webp', 8),
    (9, (SELECT id_categoria FROM categorias WHERE nombre = 'Snacks / Acompañamientos'), 'Boneless de la Casa', 'Pollo empanizado bañado en salsa BBQ o búfalo.', 79.00, '/assets/images/menu/papas-480w.webp', 9),
    (10, (SELECT id_categoria FROM categorias WHERE nombre = 'Bebidas'), 'Limonada Fresca', 'Limonada preparada al momento, servida bien fría.', 32.00, '/assets/images/menu/limonada_fresca.jpg', 10),
    (11, (SELECT id_categoria FROM categorias WHERE nombre = 'Bebidas'), 'Agua de Jamaica', 'Agua fresca de jamaica, ligeramente endulzada.', 28.00, '/assets/images/menu/bebida_jamaica.jpg', 11),
    (12, (SELECT id_categoria FROM categorias WHERE nombre = 'Bebidas'), 'Carlos Milkshake', 'Malteada cremosa con sabor a elegir hecha con leche de femboys bien fría.', 55.00, '/assets/images/menu/bebida.webp', 12);
INSERT INTO horarios_atencion (dia_semana, hora_apertura, hora_cierre, activo) VALUES
    ('lunes',     '12:00:00', '22:00:00', TRUE),
    ('martes',    '12:00:00', '22:00:00', TRUE),
    ('miercoles', '12:00:00', '22:00:00', TRUE),
    ('jueves',    '12:00:00', '22:00:00', TRUE),
    ('viernes',   '12:00:00', '23:00:00', TRUE),
    ('sabado',    '12:00:00', '23:00:00', TRUE),
    ('domingo',   '12:00:00', '21:00:00', TRUE);
