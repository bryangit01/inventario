// =====================================================================
//  server.js  →  Punto de entrada: aquí se enciende el servidor
// =====================================================================
const app = require('./app');
const { pool } = require('./config/db');
const UsuarioModel = require('./models/usuario.model');

const PORT = process.env.PORT || 3000;

async function iniciar() {
  // Sin una clave secreta los tokens serían inseguros: mejor no arrancar.
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
    console.error('Falta JWT_SECRET en tu .env (usa una frase larga y secreta).');
    process.exit(1);
  }

  try {
    const conexion = await pool.getConnection();
    conexion.release();
    console.log('Conectado a MySQL');

    // Primera vez: si no hay usuarios, crea el administrador inicial.
    const emailAdmin = await UsuarioModel.crearAdminInicialSiNoHay();
    if (emailAdmin) {
      console.log(`Usuario administrador creado: ${emailAdmin} (contraseña: la de ADMIN_PASSWORD en .env)`);
      console.log('Cámbiala después de iniciar sesión.');
    }
  } catch (error) {
    console.error('No se pudo conectar a MySQL o preparar los usuarios:', error.message);
    console.error('Revisa tu archivo .env, que MySQL esté encendido y que hayas ejecutado database/schema.sql.');
  }

  app.listen(PORT, () => {
    console.log(`API lista en http://localhost:${PORT}/api  (documentación: /api/docs)`);
  });
}

iniciar();
