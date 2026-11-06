// =====================================================================
//  models/producto.model.js  →  SQL de productos
// =====================================================================
//  Novedades v2:
//   - Paginación, orden y filtros se resuelven en MySQL (no en el navegador).
//   - Borrado lógico: "eliminar" solo marca eliminado_en; se puede restaurar.
//   - El stock (cantidad) NO se edita aquí: se cambia con movimientos.
// =====================================================================
const { pool, conTransaccion } = require('../config/db');
const { insertarMovimiento } = require('./movimiento.model');
const { respuestaPagina } = require('../utils/paginacion');

// Lista blanca de columnas para ORDER BY (nunca metas texto del usuario directo en el SQL)
const COLUMNAS_ORDEN = {
  nombre: 'p.nombre', cantidad: 'p.cantidad', precio_venta: 'p.precio_venta', sku: 'p.sku', creado_en: 'p.id',
};

const SELECT_BASE = `
  SELECT p.*, c.nombre AS categoria, pr.nombre AS proveedor
    FROM productos p
    LEFT JOIN categorias c   ON c.id  = p.categoria_id
    LEFT JOIN proveedores pr ON pr.id = p.proveedor_id`;

const formatear = (f) => ({ ...f, activo: Boolean(f.activo) });

async function obtenerPorId(id, ejecutor = pool) {
  const [f] = await ejecutor.query(`${SELECT_BASE} WHERE p.id = ?`, [id]);
  return f[0] ? formatear(f[0]) : null;
}

async function obtenerTodos({ pagina, limite, buscar, estado, categoria_id, proveedor_id, orden, dir }) {
  const where = [estado === 'papelera' ? 'p.eliminado_en IS NOT NULL' : 'p.eliminado_en IS NULL'];
  const params = [];

  if (buscar) {
    where.push('(p.nombre LIKE ? OR p.descripcion LIKE ? OR p.sku LIKE ?)');
    params.push(`%${buscar}%`, `%${buscar}%`, `%${buscar}%`);
  }
  if (estado === 'activos') where.push('p.activo = 1');
  if (estado === 'inactivos') where.push('p.activo = 0');
  if (estado === 'stock_bajo') where.push('p.cantidad <= p.stock_minimo');
  if (categoria_id) { where.push('p.categoria_id = ?'); params.push(categoria_id); }
  if (proveedor_id) { where.push('p.proveedor_id = ?'); params.push(proveedor_id); }

  const condicion = where.join(' AND ');
  const direccion = dir === 'asc' ? 'ASC' : 'DESC';

  const [conteo] = await pool.query(`SELECT COUNT(*) AS total FROM productos p WHERE ${condicion}`, params);
  const [filas] = await pool.query(
    `${SELECT_BASE} WHERE ${condicion} ORDER BY ${COLUMNAS_ORDEN[orden]} ${direccion}, p.id DESC LIMIT ? OFFSET ?`,
    [...params, limite, (pagina - 1) * limite]
  );
  return respuestaPagina(filas.map(formatear), conteo[0].total, pagina, limite);
}

/** Todos los productos no eliminados (para exportar a Excel). */
async function obtenerTodosParaExportar() {
  const [filas] = await pool.query(`${SELECT_BASE} WHERE p.eliminado_en IS NULL ORDER BY p.nombre`);
  return filas.map(formatear);
}

const COLUMNAS_INSERT = `sku, nombre, descripcion, cantidad, activo, categoria_id, proveedor_id, precio_costo, precio_venta, stock_minimo`;

async function crear(d, usuarioId) {
  return conTransaccion(async (conn) => {
    const [r] = await conn.query(
      `INSERT INTO productos (${COLUMNAS_INSERT}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.sku, d.nombre, d.descripcion, d.cantidad, d.activo ? 1 : 0, d.categoria_id, d.proveedor_id, d.precio_costo, d.precio_venta, d.stock_minimo]
    );
    if (d.cantidad > 0) {
      await insertarMovimiento(conn, {
        productoId: r.insertId, usuarioId, tipo: 'entrada', cantidad: d.cantidad,
        stockAnterior: 0, stockNuevo: d.cantidad, motivo: 'Stock inicial',
      });
    }
    return obtenerPorId(r.insertId, conn);
  });
}

/** Edita los datos del producto (NO el stock). Devuelve null si no existe o está en la papelera. */
async function actualizar(id, d) {
  const [r] = await pool.query(
    `UPDATE productos SET sku = ?, nombre = ?, descripcion = ?, activo = ?, categoria_id = ?, proveedor_id = ?,
            precio_costo = ?, precio_venta = ?, stock_minimo = ?
      WHERE id = ? AND eliminado_en IS NULL`,
    [d.sku, d.nombre, d.descripcion, d.activo ? 1 : 0, d.categoria_id, d.proveedor_id, d.precio_costo, d.precio_venta, d.stock_minimo, id]
  );
  return r.affectedRows ? obtenerPorId(id) : null;
}

async function cambiarEstado(id, activo) {
  const [r] = await pool.query('UPDATE productos SET activo = ? WHERE id = ? AND eliminado_en IS NULL', [activo ? 1 : 0, id]);
  return r.affectedRows ? obtenerPorId(id) : null;
}

/** Borrado lógico: el registro sigue en la base, pero va a la papelera. */
async function eliminar(id) {
  const [r] = await pool.query('UPDATE productos SET eliminado_en = NOW() WHERE id = ? AND eliminado_en IS NULL', [id]);
  return r.affectedRows > 0;
}

async function restaurar(id) {
  const [r] = await pool.query('UPDATE productos SET eliminado_en = NULL WHERE id = ? AND eliminado_en IS NOT NULL', [id]);
  return r.affectedRows ? obtenerPorId(id) : null;
}

/**
 * Importa filas ya validadas. Crea categorías/proveedores que no existan.
 * Una fila con error (ej. SKU repetido) no detiene a las demás.
 * @param {{fila:number, datos:object}[]} filas
 */
async function importar(filas, usuarioId) {
  return conTransaccion(async (conn) => {
    const caches = { categorias: new Map(), proveedores: new Map() };

    async function idPorNombre(tabla, nombre) {
      if (!nombre) return null;
      const clave = nombre.toLowerCase();
      if (caches[tabla].has(clave)) return caches[tabla].get(clave);
      const [f] = await conn.query(`SELECT id FROM ${tabla} WHERE nombre = ?`, [nombre]);
      let id;
      if (f.length) id = f[0].id;
      else id = (await conn.query(`INSERT INTO ${tabla} (nombre) VALUES (?)`, [nombre]))[0].insertId;
      caches[tabla].set(clave, id);
      return id;
    }

    let creados = 0;
    const errores = [];
    for (const { fila, datos: d } of filas) {
      try {
        const categoriaId = await idPorNombre('categorias', d.categoria);
        const proveedorId = await idPorNombre('proveedores', d.proveedor);
        const [r] = await conn.query(
          `INSERT INTO productos (${COLUMNAS_INSERT}) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?)`,
          [d.sku, d.nombre, d.descripcion, d.cantidad, categoriaId, proveedorId, d.precio_costo, d.precio_venta, d.stock_minimo]
        );
        if (d.cantidad > 0) {
          await insertarMovimiento(conn, {
            productoId: r.insertId, usuarioId, tipo: 'entrada', cantidad: d.cantidad,
            stockAnterior: 0, stockNuevo: d.cantidad, motivo: 'Importación desde archivo',
          });
        }
        creados++;
      } catch (error) {
        const mensaje = error.code === 'ER_DUP_ENTRY' ? 'El SKU ya existe.' : 'No se pudo guardar esta fila.';
        errores.push({ fila, mensaje });
      }
    }
    return { creados, errores };
  });
}

module.exports = { obtenerPorId, obtenerTodos, obtenerTodosParaExportar, crear, actualizar, cambiarEstado, eliminar, restaurar, importar };
