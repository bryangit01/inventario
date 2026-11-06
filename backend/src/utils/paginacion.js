// Forma estándar de toda respuesta paginada de la API.
function respuestaPagina(datos, total, pagina, limite) {
  return { datos, total, pagina, limite, totalPaginas: Math.max(1, Math.ceil(total / limite)) };
}
module.exports = { respuestaPagina };
