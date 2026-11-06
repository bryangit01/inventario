// =====================================================================
//  app.js  →  Configuración de Express (sin encenderlo)
// =====================================================================
//  El orden importa: cada línea se ejecuta de arriba hacia abajo.
// =====================================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const openapi = require('./docs/openapi');
const { rutaNoEncontrada, manejarErrores } = require('./middlewares/error.middleware');

const app = express();

// Seguridad: helmet agrega cabeceras HTTP protectoras.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: solo el frontend indicado puede llamar a esta API desde un navegador.
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200' }));

// Límite general de peticiones por IP (protege de abusos).
app.use(
  '/api',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000, standardHeaders: true, legacyHeaders: false })
);

// Lee JSON del cuerpo de las peticiones (2 MB sirve para importar hasta 1000 filas).
app.use(express.json({ limit: '2mb' }));

app.get('/api', (req, res) => res.json({ mensaje: 'API de inventario funcionando', docs: '/api/docs' }));

// Documentación interactiva (Swagger): http://localhost:3000/api/docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapi));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/productos', require('./routes/producto.routes'));
app.use('/api/categorias', require('./routes/categoria.routes'));
app.use('/api/proveedores', require('./routes/proveedor.routes'));
app.use('/api/movimientos', require('./routes/movimiento.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/usuarios', require('./routes/usuario.routes'));
app.use('/api/auditoria', require('./routes/auditoria.routes'));

// Siempre al final:
app.use(rutaNoEncontrada);
app.use(manejarErrores);

module.exports = app;
