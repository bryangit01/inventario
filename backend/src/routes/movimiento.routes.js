// routes/movimiento.routes.js → el kardex
//   GET  /api/movimientos   (todos los roles)
//   POST /api/movimientos   (admin y almacenista)
const { Router } = require('express');
const controlador = require('../controllers/movimiento.controller');
const { autenticar, permitir } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = Router();
router.use(autenticar);
router.get('/', validar(schemas.movimientoListado, 'query'), controlador.listar);
router.post('/', permitir('admin', 'almacenista'), validar(schemas.movimiento), controlador.registrar);

module.exports = router;
