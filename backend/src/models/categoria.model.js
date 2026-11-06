const { crearModeloCatalogo } = require('./catalogo.model');
module.exports = crearModeloCatalogo('categorias', ['nombre', 'descripcion']);
