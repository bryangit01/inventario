const { crearRutasCatalogo } = require('./catalogo.routes');
const { crearControladorCatalogo } = require('../controllers/catalogo.controller');
const CategoriaModel = require('../models/categoria.model');
const schemas = require('../validators/schemas');

module.exports = crearRutasCatalogo(
  crearControladorCatalogo({ modelo: CategoriaModel, entidad: 'categoria', etiqueta: 'Categoría' }),
  schemas.categoria
);
