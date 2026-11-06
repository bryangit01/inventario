// =====================================================================
//  middlewares/auth.middleware.js  →  Quién eres y qué puedes hacer
// =====================================================================
//  autenticar : exige un token válido (header "Authorization: Bearer <token>")
//  permitir   : exige que el rol del usuario esté en la lista
//
//  Uso en una ruta:  router.delete('/:id', autenticar, permitir('admin'), ...)
// =====================================================================
const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'Inicia sesión para continuar.' });
  }
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET); // { id, nombre, email, rol }
    next();
  } catch {
    res.status(401).json({ mensaje: 'Tu sesión expiró. Inicia sesión de nuevo.' });
  }
}

const permitir = (...roles) => (req, res, next) =>
  roles.includes(req.usuario?.rol)
    ? next()
    : res.status(403).json({ mensaje: 'No tienes permiso para esta acción.' });

module.exports = { autenticar, permitir };
