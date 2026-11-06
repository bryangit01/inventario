-- =====================================================================
--  Esquema COMPLETO v2 del inventario (instalación nueva)
--  Ejecútalo UNA vez en MySQL Workbench (icono del rayo).
--
--  ¿Ya tienes la v1 con datos? Usa en su lugar: migracion_v1_a_v2.sql
--  ¿Ya tienes la v1 y no te importan los datos de prueba?
--     DROP DATABASE inventario_db;   y luego ejecuta este archivo.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS inventario_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE inventario_db;

-- ---------- PASO 1: usuarios y roles ----------
CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,            -- NUNCA se guarda la contraseña en texto
  rol           ENUM('admin','almacenista','lector') NOT NULL DEFAULT 'lector',
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

-- ---------- PASO 3: catálogos ----------
CREATE TABLE IF NOT EXISTS categorias (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(80)  NOT NULL,
  descripcion VARCHAR(255) NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proveedores (
  id       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre   VARCHAR(120) NOT NULL,
  contacto VARCHAR(120) NOT NULL DEFAULT '',
  email    VARCHAR(150) NOT NULL DEFAULT '',
  telefono VARCHAR(40)  NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_proveedores_nombre (nombre)
) ENGINE=InnoDB;

-- ---------- Productos (ahora con SKU, catálogos, precios y borrado lógico) ----------
CREATE TABLE IF NOT EXISTS productos (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  sku            VARCHAR(50)   NULL,
  nombre         VARCHAR(120)  NOT NULL,
  descripcion    TEXT          NULL,
  cantidad       INT UNSIGNED  NOT NULL DEFAULT 0,   -- stock actual (solo cambia con movimientos)
  activo         TINYINT(1)    NOT NULL DEFAULT 1,
  categoria_id   INT UNSIGNED  NULL,
  proveedor_id   INT UNSIGNED  NULL,
  precio_costo   DECIMAL(12,2) NOT NULL DEFAULT 0,
  precio_venta   DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock_minimo   INT UNSIGNED  NOT NULL DEFAULT 5,   -- por debajo de esto = "stock bajo"
  eliminado_en   TIMESTAMP     NULL DEFAULT NULL,    -- borrado lógico (papelera)
  creado_en      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_productos_sku (sku),
  INDEX idx_productos_nombre (nombre),
  INDEX idx_productos_activo (activo),
  INDEX idx_productos_eliminado (eliminado_en),
  CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL,
  CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- PASO 2: kardex (historial de movimientos) ----------
CREATE TABLE IF NOT EXISTS movimientos (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id    INT UNSIGNED NOT NULL,
  usuario_id     INT UNSIGNED NULL,
  tipo           ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad       INT UNSIGNED NOT NULL,              -- unidades movidas
  stock_anterior INT UNSIGNED NOT NULL,
  stock_nuevo    INT UNSIGNED NOT NULL,
  motivo         VARCHAR(255) NULL,
  creado_en      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_mov_producto (producto_id, creado_en),
  INDEX idx_mov_fecha (creado_en),
  CONSTRAINT fk_mov_producto FOREIGN KEY (producto_id) REFERENCES productos (id),
  CONSTRAINT fk_mov_usuario  FOREIGN KEY (usuario_id)  REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- PASO 1: auditoría (quién hizo qué) ----------
CREATE TABLE IF NOT EXISTS auditoria (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NULL,
  entidad    VARCHAR(40)  NOT NULL,                  -- producto, categoria, usuario...
  entidad_id INT UNSIGNED NULL,
  accion     VARCHAR(40)  NOT NULL,                  -- crear, editar, eliminar...
  antes      JSON NULL,
  despues    JSON NULL,
  creado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_aud_entidad (entidad, entidad_id),
  INDEX idx_aud_fecha (creado_en),
  CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------- Datos de ejemplo (puedes borrarlos) ----------
INSERT INTO categorias (nombre, descripcion) VALUES
  ('Periféricos', 'Teclados, mouse y accesorios'),
  ('Pantallas', 'Monitores y proyectores'),
  ('Cables', 'Cables y conectores');

INSERT INTO proveedores (nombre, contacto, email, telefono) VALUES
  ('TecnoMayorista', 'Laura Gómez', 'ventas@tecnomayorista.example', '3000000001'),
  ('Distribuciones Andina', 'Carlos Ruiz', 'pedidos@andina.example', '3000000002');

INSERT INTO productos (sku, nombre, descripcion, cantidad, activo, categoria_id, proveedor_id, precio_costo, precio_venta, stock_minimo) VALUES
  ('TEC-001', 'Teclado mecánico', 'Switches rojos, layout español, retroiluminado.', 24, 1, 1, 1, 45.00, 89.90, 8),
  ('MOU-001', 'Mouse inalámbrico', 'Sensor óptico 1600 DPI, batería recargable.', 3, 1, 1, 1, 12.00, 24.90, 8),
  ('MON-024', 'Monitor 24 pulgadas', 'Panel IPS Full HD, entrada HDMI y VGA.', 12, 1, 2, 2, 110.00, 169.00, 4),
  ('CAB-HDMI2', 'Cable HDMI 2m', 'Cable de alta velocidad compatible con 4K.', 0, 1, 3, 2, 2.50, 7.90, 20),
  ('IMP-L01', 'Impresora láser', 'Modelo descontinuado, solo queda stock de bodega.', 5, 0, NULL, 2, 95.00, 149.00, 2);

-- Cada producto de ejemplo nace con un movimiento de "Stock inicial"
INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
  SELECT id, NULL, 'entrada', cantidad, 0, cantidad, 'Stock inicial' FROM productos WHERE cantidad > 0;

-- NOTA: el primer usuario administrador lo crea el servidor al arrancar
-- (usa ADMIN_EMAIL y ADMIN_PASSWORD de tu archivo .env).
