const { Router } = require('express');
const controlador = require('../controllers/auditoria.controller');
const { autenticar, permitir } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = Router();
router.get('/', autenticar, permitir('admin'), validar(schemas.auditoriaListado, 'query'), controlador.listar);
module.exports = router;
