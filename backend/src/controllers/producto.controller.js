// =====================================================================
//  controllers/producto.controller.js  →  Lógica de cada endpoint de productos
// =====================================================================
//  Validación (Zod) y permisos (roles) ocurren ANTES, en las rutas.
//  Aquí: pedir datos al modelo, auditar y responder.
// =====================================================================
const ExcelJS = require('exceljs');
const ProductoModel = require('../models/producto.model');
const AuditoriaModel = require('../models/auditoria.model');
const schemas = require('../validators/schemas');
const envolver = require('../utils/envolver');
const { ErrorHttp } = require('../utils/errores');

const auditar = (req, id, accion, antes, despues) =>
  AuditoriaModel.registrar({ usuarioId: req.usuario.id, entidad: 'producto', entidadId: id, accion, antes, despues });

async function obtenerOFallar(id) {
  const producto = await ProductoModel.obtenerPorId(id);
  if (!producto) throw new ErrorHttp(404, 'Producto no encontrado.');
  return producto;
}

module.exports = envolver({
  // GET /api/productos?pagina=1&limite=10&buscar=&estado=&categoria_id=&orden=&dir=
  async listar(req, res) {
    // La papelera solo la ve un administrador
    if (req.query.estado === 'papelera' && req.usuario.rol !== 'admin') {
      throw new ErrorHttp(403, 'Solo un administrador puede ver la papelera.');
    }
    res.json(await ProductoModel.obtenerTodos(req.query));
  },

  async obtener(req, res) {
    res.json(await obtenerOFallar(req.params.id));
  },

  async crear(req, res) {
    const nuevo = await ProductoModel.crear(req.body, req.usuario.id);
    await auditar(req, nuevo.id, 'crear', null, nuevo);
    res.status(201).json(nuevo);
  },

  async actualizar(req, res) {
    const antes = await obtenerOFallar(req.params.id);
    if (antes.eliminado_en) throw new ErrorHttp(404, 'Producto no encontrado.');
    const despues = await ProductoModel.actualizar(req.params.id, req.body);
    await auditar(req, antes.id, 'editar', antes, despues);
    res.json(despues);
  },

  async cambiarEstado(req, res) {
    const antes = await obtenerOFallar(req.params.id);
    const despues = await ProductoModel.cambiarEstado(req.params.id, req.body.activo);
    if (!despues) throw new ErrorHttp(404, 'Producto no encontrado.');
    await auditar(req, antes.id, req.body.activo ? 'activar' : 'desactivar', { activo: antes.activo }, { activo: despues.activo });
    res.json(despues);
  },

  async eliminar(req, res) {
    const antes = await obtenerOFallar(req.params.id);
    if (!(await ProductoModel.eliminar(req.params.id))) throw new ErrorHttp(404, 'Producto no encontrado.');
    await auditar(req, antes.id, 'eliminar', antes, null);
    res.json({ mensaje: 'Producto enviado a la papelera.' });
  },

  async restaurar(req, res) {
    const restaurado = await ProductoModel.restaurar(req.params.id);
    if (!restaurado) throw new ErrorHttp(404, 'Producto no encontrado en la papelera.');
    await auditar(req, restaurado.id, 'restaurar', null, restaurado);
    res.json(restaurado);
  },

  // GET /api/productos/exportar  →  archivo .xlsx
  async exportar(req, res) {
    const productos = await ProductoModel.obtenerTodosParaExportar();
    const libro = new ExcelJS.Workbook();
    const hoja = libro.addWorksheet('Inventario');
    hoja.columns = [
      { header: 'SKU', key: 'sku', width: 16 },
      { header: 'Nombre', key: 'nombre', width: 32 },
      { header: 'Descripción', key: 'descripcion', width: 40 },
      { header: 'Categoría', key: 'categoria', width: 18 },
      { header: 'Proveedor', key: 'proveedor', width: 22 },
      { header: 'Cantidad', key: 'cantidad', width: 10 },
      { header: 'Stock mínimo', key: 'stock_minimo', width: 13 },
      { header: 'Precio costo', key: 'precio_costo', width: 13 },
      { header: 'Precio venta', key: 'precio_venta', width: 13 },
      { header: 'Estado', key: 'estado', width: 10 },
    ];
    hoja.getRow(1).font = { bold: true };
    hoja.views = [{ state: 'frozen', ySplit: 1 }];
    productos.forEach((p) => hoja.addRow({ ...p, estado: p.activo ? 'Activo' : 'Inactivo' }));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventario.xlsx"');
    await libro.xlsx.write(res);
    res.end();
  },

  // POST /api/productos/importar  { filas: [ {sku, nombre, ...} ] }
  async importar(req, res) {
    const validas = [];
    const errores = [];
    req.body.filas.forEach((fila, i) => {
      const r = schemas.productoImportar.safeParse(fila);
      const numeroFila = i + 2; // +2: la fila 1 del archivo es el encabezado
      if (r.success) validas.push({ fila: numeroFila, datos: r.data });
      else errores.push({ fila: numeroFila, mensaje: r.error.issues.map((x) => `${x.path.join('.')}: ${x.message}`).join(' · ') });
    });

    const resultado = validas.length
      ? await ProductoModel.importar(validas, req.usuario.id)
      : { creados: 0, errores: [] };
    const todosErrores = [...errores, ...resultado.errores].sort((a, b) => a.fila - b.fila);

    await AuditoriaModel.registrar({
      usuarioId: req.usuario.id, entidad: 'producto', accion: 'importar',
      despues: { creados: resultado.creados, filas_con_error: todosErrores.length },
    });
    res.status(201).json({ creados: resultado.creados, errores: todosErrores });
  },
});
