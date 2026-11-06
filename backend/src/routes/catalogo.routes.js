// routes/catalogo.routes.js → Fábrica de rutas para categorías y proveedores.
const { Router } = require('express');
const { autenticar, permitir } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validate.middleware');

function crearRutasCatalogo(controlador, schema) {
  const router = Router();
  router.use(autenticar);
  router.get('/', controlador.listar);
  router.post('/', permitir('admin', 'almacenista'), validar(schema), controlador.crear);
  router.put('/:id', permitir('admin', 'almacenista'), validar(schema), controlador.actualizar);
  router.delete('/:id', permitir('admin'), controlador.eliminar);
  return router;
}

module.exports = { crearRutasCatalogo };
