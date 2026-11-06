const { Router } = require('express');
const controlador = require('../controllers/dashboard.controller');
const { autenticar } = require('../middlewares/auth.middleware');

const router = Router();
router.get('/', autenticar, controlador.resumen);
module.exports = router;
