// models/dashboard.model.js → Consultas de resumen para el panel de control.
const { pool } = require('../config/db');

async function resumen() {
  const [[totales]] = await pool.query(`
    SELECT COUNT(*)                                        AS productos,
           COALESCE(SUM(cantidad), 0)                      AS unidades,
           COALESCE(SUM(cantidad * precio_costo), 0)       AS valor_costo,
           COALESCE(SUM(cantidad * precio_venta), 0)       AS valor_venta,
           COALESCE(SUM(cantidad > 0 AND cantidad <= stock_minimo), 0) AS stock_bajo,
           COALESCE(SUM(cantidad = 0), 0)                  AS agotados,
           COALESCE(SUM(activo = 1), 0)                    AS activos
      FROM productos WHERE eliminado_en IS NULL`);

  const [porCategoria] = await pool.query(`
    SELECT COALESCE(c.nombre, 'Sin categoría') AS nombre,
           COUNT(*) AS productos, COALESCE(SUM(p.cantidad), 0) AS unidades
      FROM productos p LEFT JOIN categorias c ON c.id = p.categoria_id
     WHERE p.eliminado_en IS NULL
     GROUP BY c.id, c.nombre ORDER BY unidades DESC LIMIT 8`);

  const [movimientosPorDia] = await pool.query(`
    SELECT DATE_FORMAT(creado_en, '%Y-%m-%d') AS dia,
           COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE 0 END), 0) AS entradas,
           COALESCE(SUM(CASE WHEN tipo = 'salida'  THEN cantidad ELSE 0 END), 0) AS salidas
      FROM movimientos
     WHERE creado_en >= (CURDATE() - INTERVAL 13 DAY)
     GROUP BY DATE_FORMAT(creado_en, '%Y-%m-%d') ORDER BY dia`);

  const [alertas] = await pool.query(`
    SELECT id, nombre, sku, cantidad, stock_minimo FROM productos
     WHERE eliminado_en IS NULL AND activo = 1 AND cantidad <= stock_minimo
     ORDER BY cantidad ASC, nombre LIMIT 6`);

  return {
    totales: Object.fromEntries(Object.entries(totales).map(([k, v]) => [k, Number(v)])),
    porCategoria: porCategoria.map((f) => ({ ...f, unidades: Number(f.unidades) })),
    movimientosPorDia: movimientosPorDia.map((f) => ({ ...f, entradas: Number(f.entradas), salidas: Number(f.salidas) })),
    alertas,
  };
}

module.exports = { resumen };
