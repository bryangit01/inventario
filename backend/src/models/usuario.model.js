// models/usuario.model.js → SQL de usuarios. El hash de la contraseña NUNCA sale de aquí
// salvo en obtenerPorEmail (lo necesita el login para comparar).
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const publico = (u) =>
  u && { id: u.id, nombre: u.nombre, email: u.email, rol: u.rol, activo: Boolean(u.activo), creado_en: u.creado_en };

async function obtenerPorEmail(email) {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
  return filas[0] || null; // incluye password_hash
}

async function obtenerPorId(id) {
  const [filas] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
  return publico(filas[0]) || null;
}

async function listar() {
  const [filas] = await pool.query('SELECT * FROM usuarios ORDER BY id');
  return filas.map(publico);
}

async function crear({ nombre, email, password, rol }) {
  const hash = await bcrypt.hash(password, 10); // 10 = costo del cifrado
  const [r] = await pool.query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    [nombre, email, hash, rol]
  );
  return obtenerPorId(r.insertId);
}

async function actualizar(id, cambios) {
  const sets = [];
  const params = [];
  if (cambios.nombre !== undefined) { sets.push('nombre = ?'); params.push(cambios.nombre); }
  if (cambios.rol !== undefined) { sets.push('rol = ?'); params.push(cambios.rol); }
  if (cambios.activo !== undefined) { sets.push('activo = ?'); params.push(cambios.activo ? 1 : 0); }
  if (cambios.password !== undefined) {
    sets.push('password_hash = ?');
    params.push(await bcrypt.hash(cambios.password, 10));
  }
  if (!sets.length) return obtenerPorId(id);
  params.push(id);
  const [r] = await pool.query(`UPDATE usuarios SET ${sets.join(', ')} WHERE id = ?`, params);
  if (r.affectedRows === 0) return null;
  return obtenerPorId(id);
}

/** Si la tabla está vacía, crea el administrador inicial con los datos del .env */
async function crearAdminInicialSiNoHay() {
  const [filas] = await pool.query('SELECT COUNT(*) AS total FROM usuarios');
  if (filas[0].total > 0) return null;
  const email = (process.env.ADMIN_EMAIL || 'admin@inventario.com').toLowerCase();
  await crear({
    nombre: process.env.ADMIN_NOMBRE || 'Administrador',
    email,
    password: process.env.ADMIN_PASSWORD || 'Admin12345',
    rol: 'admin',
  });
  return email;
}

module.exports = { obtenerPorEmail, obtenerPorId, listar, crear, actualizar, crearAdminInicialSiNoHay };
