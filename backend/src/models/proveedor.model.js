const { crearModeloCatalogo } = require('./catalogo.model');
module.exports = crearModeloCatalogo('proveedores', ['nombre', 'contacto', 'email', 'telefono']);
