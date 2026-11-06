// =====================================================================
//  config/db.js  →  Conexión a MySQL
// =====================================================================
//  - "pool": conexiones reutilizables (más rápido que abrir una por consulta).
//  - decimalNumbers: los DECIMAL (precios) llegan como número, no como texto.
//  - conTransaccion(): ejecuta varias consultas como UNA sola operación.
//    Si algo falla, se deshace todo (rollback). Es clave para el kardex:
//    nunca puede cambiar el stock sin que quede el movimiento registrado.
// =====================================================================
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'inventario_db',
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true,
});

async function conTransaccion(trabajo) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const resultado = await trabajo(conexion);
    await conexion.commit();
    return resultado;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

module.exports = { pool, conTransaccion };
