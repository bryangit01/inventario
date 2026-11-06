// Error con código HTTP. Lánzalo desde cualquier capa: throw new ErrorHttp(404, 'No existe').
// El middleware de errores lo convierte en la respuesta correcta.
class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
module.exports = { ErrorHttp };
