// =====================================================================
//  models/movimiento.model.js  →  El kardex
// =====================================================================
//  REGLA DE ORO: el stock de un producto (productos.cantidad) solo cambia
//  mediante un movimiento. Cada movimiento guarda el stock ANTES y DESPUÉS,
//  así se puede reconstruir qué pasó con cada unidad.
//
//  Tipos:
//   entrada → suma unidades (compra, devolución...)
//   salida  → resta unidades (venta, merma...). No permite quedar en negativo.
//   ajuste  → fija el stock al número contado (inventario físico)
// =====================================================================
const { pool, conTransaccion } = require('../config/db');
const { ErrorHttp } = require('../utils/errores');
const { respuestaPagina } = require('../utils/paginacion');

/** Inserta la fila del movimiento. Se usa dentro de una transacción. */
async function insertarMovimiento(conn, { productoId, usuarioId, tipo, cantidad, stockAnterior, stockNuevo, motivo }) {
  const [r] = await conn.query(
    `INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, motivo)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [productoId, usuarioId ?? null, tipo, cantidad, stockAnterior, stockNuevo, motivo || null]
  );
  return r.insertId;
}

/** Registra un movimiento y actualiza el stock, todo en una sola transacción. */
async function registrar({ productoId, tipo, cantidad, motivo, usuarioId }) {
  return conTransaccion(async (conn) => {
    // FOR UPDATE bloquea la fila: si dos personas mueven el mismo producto a la vez,
    // la segunda espera a que termine la primera (evita stock incorrecto).
    const [filas] = await conn.query(
      'SELECT id, cantidad FROM productos WHERE id = ? AND eliminado_en IS NULL FOR UPDATE',
      [productoId]
    );
    if (!filas.length) throw new ErrorHttp(404, 'Producto no encontrado.');

    const stockAnterior = filas[0].cantidad;
    let stockNuevo;
    if (tipo === 'entrada') stockNuevo = stockAnterior + cantidad;
    else if (tipo === 'salida') {
      if (cantidad > stockAnterior) {
        throw new ErrorHttp(400, `Stock insuficiente: solo hay ${stockAnterior} unidades.`);
      }
      stockNuevo = stockAnterior - cantidad;
    } else stockNuevo = cantidad; // ajuste: "cantidad" es el nuevo conteo

    const unidades = tipo === 'ajuste' ? Math.abs(stockNuevo - stockAnterior) : cantidad;

    await conn.query('UPDATE productos SET cantidad = ? WHERE id = ?', [stockNuevo, productoId]);
    const id = await insertarMovimiento(conn, {
      productoId, usuarioId, tipo, cantidad: unidades, stockAnterior, stockNuevo, motivo,
    });
    return { id, producto_id: productoId, tipo, cantidad: unidades, stock_anterior: stockAnterior, stock_nuevo: stockNuevo, motivo };
  });
}

async function listar({ pagina, limite, producto_id, tipo }) {
  const where = ['1 = 1'];
  const params = [];
  if (producto_id) { where.push('m.producto_id = ?'); params.push(producto_id); }
  if (tipo) { where.push('m.tipo = ?'); params.push(tipo); }

  const [conteo] = await pool.query(`SELECT COUNT(*) AS total FROM movimientos m WHERE ${where.join(' AND ')}`, params);
  const [filas] = await pool.query(
    `SELECT m.*, p.nombre AS producto, p.sku, u.nombre AS usuario
       FROM movimientos m
       JOIN productos p ON p.id = m.producto_id
       LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE ${where.join(' AND ')}
      ORDER BY m.id DESC
      LIMIT ? OFFSET ?`,
    [...params, limite, (pagina - 1) * limite]
  );
  return respuestaPagina(filas, conteo[0].total, pagina, limite);
}

module.exports = { insertarMovimiento, registrar, listar };
