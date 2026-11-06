// controllers/usuario.controller.js → Gestión de usuarios (solo administradores)
const UsuarioModel = require('../models/usuario.model');
const AuditoriaModel = require('../models/auditoria.model');
const envolver = require('../utils/envolver');
const { ErrorHttp } = require('../utils/errores');

module.exports = envolver({
  async listar(req, res) {
    res.json(await UsuarioModel.listar());
  },

  async crear(req, res) {
    const usuario = await UsuarioModel.crear(req.body);
    await AuditoriaModel.registrar({ usuarioId: req.usuario.id, entidad: 'usuario', entidadId: usuario.id, accion: 'crear', despues: usuario });
    res.status(201).json(usuario);
  },

  async actualizar(req, res) {
    const id = Number(req.params.id);
    // Evita que un admin se deje a sí mismo sin acceso por accidente
    if (id === req.usuario.id && (req.body.activo === false || (req.body.rol && req.body.rol !== 'admin'))) {
      throw new ErrorHttp(400, 'No puedes quitarte tu propio acceso de administrador.');
    }
    const antes = await UsuarioModel.obtenerPorId(id);
    if (!antes) throw new ErrorHttp(404, 'Usuario no encontrado.');
    const despues = await UsuarioModel.actualizar(id, req.body);
    await AuditoriaModel.registrar({
      usuarioId: req.usuario.id, entidad: 'usuario', entidadId: id,
      accion: req.body.password ? 'cambiar_contraseña' : 'editar', antes, despues,
    });
    res.json(despues);
  },
});
