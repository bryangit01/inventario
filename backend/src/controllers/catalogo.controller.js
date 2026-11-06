// =====================================================================
//  controllers/catalogo.controller.js  →  Fábrica de controladores de catálogo
// =====================================================================
//  Igual que el modelo: categorías y proveedores comparten el mismo CRUD.
//  "entidad" es el nombre que queda en la auditoría; "etiqueta" se usa en mensajes.
// =====================================================================
const AuditoriaModel = require('../models/auditoria.model');
const envolver = require('../utils/envolver');
const { ErrorHttp } = require('../utils/errores');

function crearControladorCatalogo({ modelo, entidad, etiqueta }) {
  const noExiste = () => new ErrorHttp(404, `${etiqueta} no encontrado.`);
  const auditar = (req, id, accion, antes, despues) =>
    AuditoriaModel.registrar({ usuarioId: req.usuario.id, entidad, entidadId: id, accion, antes, despues });

  return envolver({
    async listar(req, res) {
      res.json(await modelo.listar());
    },

    async crear(req, res) {
      const nuevo = await modelo.crear(req.body);
      await auditar(req, nuevo.id, 'crear', null, nuevo);
      res.status(201).json(nuevo);
    },

    async actualizar(req, res) {
      const antes = await modelo.obtenerPorId(req.params.id);
      if (!antes) throw noExiste();
      const despues = await modelo.actualizar(req.params.id, req.body);
      await auditar(req, antes.id, 'editar', antes, despues);
      res.json(despues);
    },

    async eliminar(req, res) {
      const antes = await modelo.obtenerPorId(req.params.id);
      if (!antes) throw noExiste();
      await modelo.eliminar(req.params.id);
      await auditar(req, antes.id, 'eliminar', antes, null);
      res.json({ mensaje: `${etiqueta} eliminado. Los productos que lo usaban quedaron sin asignar.` });
    },
  });
}

module.exports = { crearControladorCatalogo };
