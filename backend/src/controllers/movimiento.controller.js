// controllers/movimiento.controller.js → Registrar y consultar el kardex
const MovimientoModel = require('../models/movimiento.model');
const ProductoModel = require('../models/producto.model');
const AuditoriaModel = require('../models/auditoria.model');
const envolver = require('../utils/envolver');

module.exports = envolver({
  // POST /api/movimientos  { producto_id, tipo, cantidad, motivo }
  async registrar(req, res) {
    const movimiento = await MovimientoModel.registrar({
      productoId: req.body.producto_id,
      tipo: req.body.tipo,
      cantidad: req.body.cantidad,
      motivo: req.body.motivo,
      usuarioId: req.usuario.id,
    });
    const producto = await ProductoModel.obtenerPorId(req.body.producto_id);
    await AuditoriaModel.registrar({
      usuarioId: req.usuario.id, entidad: 'producto', entidadId: producto.id, accion: `movimiento_${movimiento.tipo}`,
      antes: { cantidad: movimiento.stock_anterior }, despues: { cantidad: movimiento.stock_nuevo },
    });
    res.status(201).json({ movimiento, producto });
  },

  // GET /api/movimientos?pagina=&limite=&producto_id=&tipo=
  async listar(req, res) {
    res.json(await MovimientoModel.listar(req.query));
  },
});
