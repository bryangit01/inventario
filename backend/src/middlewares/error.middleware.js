// =====================================================================
//  middlewares/error.middleware.js  →  Manejo central de errores
// =====================================================================
function rutaNoEncontrada(req, res) {
  res.status(404).json({ mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.` });
}

// Express reconoce un middleware de errores porque tiene 4 parámetros.
// eslint-disable-next-line no-unused-vars
function manejarErrores(error, req, res, next) {
  // JSON mal formado en el cuerpo de la petición
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido.' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ mensaje: 'El archivo es demasiado grande.' });
  }

  // Errores que lanzamos nosotros a propósito (ErrorHttp)
  if (error.status) return res.status(error.status).json({ mensaje: error.message });

  // Errores típicos de MySQL
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con ese valor (por ejemplo, un SKU o nombre repetido).' });
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ mensaje: 'La categoría o el proveedor indicado no existe.' });
  }
  if (error.code === 'ECONNREFUSED' || error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('Error de base de datos:', error.message);
    return res.status(500).json({ mensaje: 'No se pudo conectar con la base de datos. Revisa tu archivo .env.' });
  }

  console.error('Error:', error);
  res.status(500).json({ mensaje: 'Ocurrió un error en el servidor.' });
}

module.exports = { rutaNoEncontrada, manejarErrores };
