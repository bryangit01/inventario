// En Express 4, un error dentro de una función async no llega solo al middleware
// de errores. Esta utilidad envuelve cada función de un controlador para que sí.
// Así los controladores no necesitan try/catch en todos lados.
module.exports = function envolver(controlador) {
  return Object.fromEntries(
    Object.entries(controlador).map(([nombre, funcion]) => [
      nombre,
      (req, res, next) => Promise.resolve(funcion(req, res, next)).catch(next),
    ])
  );
};
