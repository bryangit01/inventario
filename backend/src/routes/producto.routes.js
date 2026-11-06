// =====================================================================
//  routes/producto.routes.js  →  URL + permisos + validación
// =====================================================================
//  Cada ruta se lee de izquierda a derecha:
//    método  URL   [quién puede]   [validación]   controlador
//
//  Roles:  admin (todo) · almacenista (crea y edita) · lector (solo mira)
//  IMPORTANTE: '/exportar' va ANTES de '/:id', si no Express lo confundiría con un id.
// =====================================================================
const { Router } = require('express');
const controlador = require('../controllers/producto.controller');
const { autenticar, permitir } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = Router();
router.use(autenticar); // todo este archivo requiere sesión

const escritura = permitir('admin', 'almacenista');

router.get('/', validar(schemas.productoListado, 'query'), controlador.listar);
router.get('/exportar', controlador.exportar);
router.post('/importar', escritura, validar(schemas.importar), controlador.importar);
router.get('/:id', controlador.obtener);
router.post('/', escritura, validar(schemas.producto), controlador.crear);
router.put('/:id', escritura, validar(schemas.producto), controlador.actualizar);
router.patch('/:id/estado', escritura, validar(schemas.productoEstado), controlador.cambiarEstado);
router.post('/:id/restaurar', permitir('admin'), controlador.restaurar);
router.delete('/:id', permitir('admin'), controlador.eliminar);

module.exports = router;
