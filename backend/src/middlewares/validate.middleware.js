// Valida req.body / req.query / req.params con un esquema de Zod.
// Si hay errores responde 400; si no, reemplaza los datos por la versión
// ya limpia (textos recortados, números convertidos, valores por defecto).
function validar(schema, origen = 'body') {
  return (req, res, next) => {
    const resultado = schema.safeParse(req[origen]);
    if (!resultado.success) {
      const errores = resultado.error.issues.map(
        (i) => `${i.path.join('.') || 'dato'}: ${i.message}`
      );
      return res.status(400).json({ mensaje: errores.join(' · '), errores });
    }
    req[origen] = resultado.data;
    next();
  };
}
module.exports = { validar };
