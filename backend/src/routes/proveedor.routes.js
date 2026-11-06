const { crearRutasCatalogo } = require('./catalogo.routes');
const { crearControladorCatalogo } = require('../controllers/catalogo.controller');
const ProveedorModel = require('../models/proveedor.model');
const schemas = require('../validators/schemas');

module.exports = crearRutasCatalogo(
  crearControladorCatalogo({ modelo: ProveedorModel, entidad: 'proveedor', etiqueta: 'Proveedor' }),
  schemas.proveedor
);
