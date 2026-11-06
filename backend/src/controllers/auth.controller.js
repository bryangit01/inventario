// controllers/auth.controller.js → Inicio de sesión
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');
const envolver = require('../utils/envolver');
const { ErrorHttp } = require('../utils/errores');

module.exports = envolver({
  // POST /api/auth/login  { email, password }  →  { token, usuario }
  async login(req, res) {
    const { email, password } = req.body;
    const usuario = await UsuarioModel.obtenerPorEmail(email);

    // Mismo mensaje si el correo no existe o la contraseña falla:
    // así no se le revela a un atacante qué correos están registrados.
    const credencialesOk = usuario && (await bcrypt.compare(password, usuario.password_hash));
    if (!credencialesOk) throw new ErrorHttp(401, 'Correo o contraseña incorrectos.');
    if (!usuario.activo) throw new ErrorHttp(403, 'Tu usuario está desactivado. Habla con un administrador.');

    const datos = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
    const token = jwt.sign(datos, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRA || '8h' });
    res.json({ token, usuario: datos });
  },

  // GET /api/auth/yo  →  datos actuales del usuario del token
  async yo(req, res) {
    const usuario = await UsuarioModel.obtenerPorId(req.usuario.id);
    if (!usuario || !usuario.activo) throw new ErrorHttp(401, 'Tu sesión ya no es válida.');
    res.json(usuario);
  },
});
