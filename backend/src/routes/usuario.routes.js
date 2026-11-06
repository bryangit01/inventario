// routes/usuario.routes.js → solo administradores
const { Router } = require('express');
const controlador = require('../controllers/usuario.controller');
const { autenticar, permitir } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = Router();
router.use(autenticar, permitir('admin'));
router.get('/', controlador.listar);
router.post('/', validar(schemas.usuarioCrear), controlador.crear);
router.patch('/:id', validar(schemas.usuarioActualizar), controlador.actualizar);

module.exports = router;
