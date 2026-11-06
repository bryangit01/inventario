// models/auditoria.model.js → Registro de quién hizo qué.
// registrar() NUNCA lanza errores: si la auditoría falla, la operación principal
// (ya hecha) no debe fallar por eso; solo dejamos el error en consola.
const { pool } = require('../config/db');
const { respuestaPagina } = require('../utils/paginacion');

async function registrar({ usuarioId, entidad, entidadId, accion, antes = null, despues = null }) {
  try {
    await pool.query(
      'INSERT INTO auditoria (usuario_id, entidad, entidad_id, accion, antes, despues) VALUES (?, ?, ?, ?, ?, ?)',
      [usuarioId ?? null, entidad, entidadId ?? null, accion, antes ? JSON.stringify(antes) : null, despues ? JSON.stringify(despues) : null]
    );
  } catch (error) {
    console.error('No se pudo registrar la auditoría:', error.message);
  }
}

async function listar({ pagina, limite, entidad }) {
  const where = entidad ? 'WHERE a.entidad = ?' : '';
  const params = entidad ? [entidad] : [];
  const [conteo] = await pool.query(`SELECT COUNT(*) AS total FROM auditoria a ${where}`, params);
  const [filas] = await pool.query(
    `SELECT a.*, u.nombre AS usuario FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
       ${where} ORDER BY a.id DESC LIMIT ? OFFSET ?`,
    [...params, limite, (pagina - 1) * limite]
  );
  return respuestaPagina(filas, conteo[0].total, pagina, limite);
}

module.exports = { registrar, listar };
