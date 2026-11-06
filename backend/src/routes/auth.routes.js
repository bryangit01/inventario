// routes/auth.routes.js
//   POST /api/auth/login   (público, con límite de intentos)
//   GET  /api/auth/yo      (requiere sesión)
const { Router } = require('express');
const rateLimit = require('express-rate-limit');
const controlador = require('../controllers/auth.controller');
const { autenticar } = require('../middlewares/auth.middleware');
const { validar } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

// Frena ataques de fuerza bruta: máximo 10 intentos de login cada 15 minutos por IP.
const limitadorLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensaje: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' },
});

const router = Router();
router.post('/login', limitadorLogin, validar(schemas.login), controlador.login);
router.get('/yo', autenticar, controlador.yo);

module.exports = router;
