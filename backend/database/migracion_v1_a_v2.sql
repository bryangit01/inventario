-- =====================================================================
--  Migración v1 → v2 (conserva tus productos actuales)
--  Ejecútalo UNA sola vez sobre la base inventario_db que ya tienes.
-- =====================================================================
USE inventario_db;

CREATE TABLE IF NOT EXISTS usuarios (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(100) NOT NULL,
  rol           ENUM('admin','almacenista','lector') NOT NULL DEFAULT 'lector',
  activo        TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB;

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

ALTER TABLE productos
  ADD COLUMN sku          VARCHAR(50)   NULL AFTER id,
  ADD COLUMN categoria_id INT UNSIGNED  NULL,
  ADD COLUMN proveedor_id INT UNSIGNED  NULL,
  ADD COLUMN precio_costo DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN precio_venta DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN stock_minimo INT UNSIGNED  NOT NULL DEFAULT 5,
  ADD COLUMN eliminado_en TIMESTAMP     NULL DEFAULT NULL,
  ADD UNIQUE KEY uq_productos_sku (sku),
  ADD INDEX idx_productos_eliminado (eliminado_en),
  ADD CONSTRAINT fk_productos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_productos_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS movimientos (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  producto_id    INT UNSIGNED NOT NULL,
  usuario_id     INT UNSIGNED NULL,
  tipo           ENUM('entrada','salida','ajuste') NOT NULL,
  cantidad       INT UNSIGNED NOT NULL,
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

CREATE TABLE IF NOT EXISTS auditoria (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NULL,
  entidad    VARCHAR(40)  NOT NULL,
  entidad_id INT UNSIGNED NULL,
  accion     VARCHAR(40)  NOT NULL,
  antes      JSON NULL,
  despues    JSON NULL,
  creado_en  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_aud_entidad (entidad, entidad_id),
  INDEX idx_aud_fecha (creado_en),
  CONSTRAINT fk_aud_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- El stock que ya tenías pasa a ser el "Stock inicial" del kardex
INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
  SELECT id, NULL, 'entrada', cantidad, 0, cantidad, 'Stock inicial (migración)' FROM productos WHERE cantidad > 0;
