// =====================================================================
//  models/catalogo.model.js  →  "Fábrica" de modelos para catálogos simples
// =====================================================================
//  Categorías y proveedores tienen el mismo CRUD; solo cambian la tabla y
//  las columnas. En vez de copiar y pegar, esta función genera el modelo.
//  (Si algún día un catálogo necesita lógica propia, crea su archivo aparte.)
//  Seguridad: "tabla" y "campos" son constantes nuestras, nunca vienen del usuario.
// =====================================================================
const { pool } = require('../config/db');

function crearModeloCatalogo(tabla, campos) {
  async function obtenerPorId(id) {
    const [f] = await pool.query(`SELECT * FROM ${tabla} WHERE id = ?`, [id]);
    return f[0] || null;
  }

  return {
    obtenerPorId,

    async listar() {
      const [f] = await pool.query(`SELECT * FROM ${tabla} ORDER BY nombre`);
      return f;
    },

    async crear(datos) {
      const [r] = await pool.query(
        `INSERT INTO ${tabla} (${campos.join(', ')}) VALUES (${campos.map(() => '?').join(', ')})`,
        campos.map((c) => datos[c])
      );
      return obtenerPorId(r.insertId);
    },

    async actualizar(id, datos) {
      const [r] = await pool.query(
        `UPDATE ${tabla} SET ${campos.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`,
        [...campos.map((c) => datos[c]), id]
      );
      return r.affectedRows ? obtenerPorId(id) : null;
    },

    async eliminar(id) {
      const [r] = await pool.query(`DELETE FROM ${tabla} WHERE id = ?`, [id]);
      return r.affectedRows > 0;
    },
  };
}

module.exports = { crearModeloCatalogo };
