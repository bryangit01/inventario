// =====================================================================
//  docs/openapi.js  →  Documentación de la API (formato OpenAPI 3)
// =====================================================================
//  Se muestra en http://localhost:3000/api/docs. Ahí puedes probar cada
//  endpoint: pulsa "Authorize", pega el token que devuelve /auth/login
//  y ejecuta las peticiones desde el navegador.
//  Cuando agregues un endpoint, agrega su entrada en "paths".
// =====================================================================
const seguro = [{ bearerAuth: [] }];
const json = (ref) => ({ 'application/json': { schema: { $ref: `#/components/schemas/${ref}` } } });
const parametroId = { name: 'id', in: 'path', required: true, schema: { type: 'integer' } };
const respuestas = { 401: { description: 'Sin sesión o token vencido' }, 403: { description: 'Sin permiso' } };

const consultaPaginada = [
  { name: 'pagina', in: 'query', schema: { type: 'integer', default: 1 } },
  { name: 'limite', in: 'query', schema: { type: 'integer', default: 10, maximum: 100 } },
];

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'API de Inventario',
    version: '2.0.0',
    description: 'Roles: **admin** (todo), **almacenista** (crea y edita), **lector** (solo consulta).',
  },
  servers: [{ url: '/api' }],
  tags: [
    { name: 'Auth' }, { name: 'Productos' }, { name: 'Movimientos' },
    { name: 'Catálogos' }, { name: 'Panel' }, { name: 'Usuarios' }, { name: 'Auditoría' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Login: {
        type: 'object', required: ['email', 'password'],
        properties: { email: { type: 'string', example: 'admin@inventario.com' }, password: { type: 'string' } },
      },
      Producto: {
        type: 'object', required: ['nombre'],
        properties: {
          sku: { type: 'string', example: 'TEC-001' }, nombre: { type: 'string', example: 'Teclado mecánico' },
          descripcion: { type: 'string' },
          cantidad: { type: 'integer', description: 'Solo se usa al crear (stock inicial)' },
          activo: { type: 'boolean', default: true },
          categoria_id: { type: 'integer', nullable: true }, proveedor_id: { type: 'integer', nullable: true },
          precio_costo: { type: 'number' }, precio_venta: { type: 'number' }, stock_minimo: { type: 'integer', default: 5 },
        },
      },
      Movimiento: {
        type: 'object', required: ['producto_id', 'tipo', 'cantidad'],
        properties: {
          producto_id: { type: 'integer' },
          tipo: { type: 'string', enum: ['entrada', 'salida', 'ajuste'] },
          cantidad: { type: 'integer', description: 'En "ajuste" es el nuevo conteo total' },
          motivo: { type: 'string' },
        },
      },
      Importar: { type: 'object', properties: { filas: { type: 'array', items: { type: 'object' } } } },
      Categoria: { type: 'object', required: ['nombre'], properties: { nombre: { type: 'string' }, descripcion: { type: 'string' } } },
      Proveedor: {
        type: 'object', required: ['nombre'],
        properties: { nombre: { type: 'string' }, contacto: { type: 'string' }, email: { type: 'string' }, telefono: { type: 'string' } },
      },
      Usuario: {
        type: 'object', required: ['nombre', 'email', 'password', 'rol'],
        properties: {
          nombre: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 8 },
          rol: { type: 'string', enum: ['admin', 'almacenista', 'lector'] },
        },
      },
    },
  },
  paths: {
    '/auth/login': {
      post: { tags: ['Auth'], summary: 'Iniciar sesión (devuelve el token)', requestBody: { content: json('Login') }, responses: { 200: { description: '{ token, usuario }' }, 401: { description: 'Credenciales incorrectas' } } },
    },
    '/auth/yo': { get: { tags: ['Auth'], summary: 'Datos del usuario actual', security: seguro, responses: { 200: { description: 'OK' }, ...respuestas } } },

    '/productos': {
      get: {
        tags: ['Productos'], summary: 'Listar con paginación, búsqueda y filtros', security: seguro,
        parameters: [
          ...consultaPaginada,
          { name: 'buscar', in: 'query', schema: { type: 'string' } },
          { name: 'estado', in: 'query', schema: { type: 'string', enum: ['todos', 'activos', 'inactivos', 'stock_bajo', 'papelera'] } },
          { name: 'categoria_id', in: 'query', schema: { type: 'integer' } },
          { name: 'proveedor_id', in: 'query', schema: { type: 'integer' } },
          { name: 'orden', in: 'query', schema: { type: 'string', enum: ['nombre', 'cantidad', 'precio_venta', 'sku', 'creado_en'] } },
          { name: 'dir', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
        ],
        responses: { 200: { description: '{ datos, total, pagina, limite, totalPaginas }' }, ...respuestas },
      },
      post: { tags: ['Productos'], summary: 'Crear (admin, almacenista)', security: seguro, requestBody: { content: json('Producto') }, responses: { 201: { description: 'Creado' }, 400: { description: 'Datos inválidos' }, 409: { description: 'SKU repetido' }, ...respuestas } },
    },
    '/productos/{id}': {
      get: { tags: ['Productos'], summary: 'Ver uno', security: seguro, parameters: [parametroId], responses: { 200: { description: 'OK' }, 404: { description: 'No existe' } } },
      put: { tags: ['Productos'], summary: 'Editar datos (no el stock) (admin, almacenista)', security: seguro, parameters: [parametroId], requestBody: { content: json('Producto') }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Productos'], summary: 'Enviar a la papelera (admin)', security: seguro, parameters: [parametroId], responses: { 200: { description: 'OK' } } },
    },
    '/productos/{id}/restaurar': { post: { tags: ['Productos'], summary: 'Sacar de la papelera (admin)', security: seguro, parameters: [parametroId], responses: { 200: { description: 'OK' } } } },
    '/productos/{id}/estado': { patch: { tags: ['Productos'], summary: 'Activar / desactivar', security: seguro, parameters: [parametroId], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { activo: { type: 'boolean' } } } } } }, responses: { 200: { description: 'OK' } } } },
    '/productos/exportar': { get: { tags: ['Productos'], summary: 'Descargar inventario en Excel', security: seguro, responses: { 200: { description: 'Archivo .xlsx' } } } },
    '/productos/importar': { post: { tags: ['Productos'], summary: 'Importar filas (admin, almacenista)', security: seguro, requestBody: { content: json('Importar') }, responses: { 201: { description: '{ creados, errores[] }' } } } },

    '/movimientos': {
      get: {
        tags: ['Movimientos'], summary: 'Kardex paginado', security: seguro,
        parameters: [...consultaPaginada, { name: 'producto_id', in: 'query', schema: { type: 'integer' } }, { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['entrada', 'salida', 'ajuste'] } }],
        responses: { 200: { description: 'OK' } },
      },
      post: { tags: ['Movimientos'], summary: 'Registrar entrada, salida o ajuste (admin, almacenista)', security: seguro, requestBody: { content: json('Movimiento') }, responses: { 201: { description: '{ movimiento, producto }' }, 400: { description: 'Stock insuficiente o datos inválidos' } } },
    },

    '/categorias': {
      get: { tags: ['Catálogos'], summary: 'Listar categorías', security: seguro, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Catálogos'], summary: 'Crear categoría', security: seguro, requestBody: { content: json('Categoria') }, responses: { 201: { description: 'Creada' } } },
    },
    '/categorias/{id}': {
      put: { tags: ['Catálogos'], summary: 'Editar categoría', security: seguro, parameters: [parametroId], requestBody: { content: json('Categoria') }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Catálogos'], summary: 'Eliminar categoría (admin)', security: seguro, parameters: [parametroId], responses: { 200: { description: 'OK' } } },
    },
    '/proveedores': {
      get: { tags: ['Catálogos'], summary: 'Listar proveedores', security: seguro, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Catálogos'], summary: 'Crear proveedor', security: seguro, requestBody: { content: json('Proveedor') }, responses: { 201: { description: 'Creado' } } },
    },
    '/proveedores/{id}': {
      put: { tags: ['Catálogos'], summary: 'Editar proveedor', security: seguro, parameters: [parametroId], requestBody: { content: json('Proveedor') }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Catálogos'], summary: 'Eliminar proveedor (admin)', security: seguro, parameters: [parametroId], responses: { 200: { description: 'OK' } } },
    },

    '/dashboard': { get: { tags: ['Panel'], summary: 'Resumen para el panel de control', security: seguro, responses: { 200: { description: 'OK' } } } },

    '/usuarios': {
      get: { tags: ['Usuarios'], summary: 'Listar usuarios (admin)', security: seguro, responses: { 200: { description: 'OK' } } },
      post: { tags: ['Usuarios'], summary: 'Crear usuario (admin)', security: seguro, requestBody: { content: json('Usuario') }, responses: { 201: { description: 'Creado' } } },
    },
    '/usuarios/{id}': { patch: { tags: ['Usuarios'], summary: 'Cambiar rol, estado, nombre o contraseña (admin)', security: seguro, parameters: [parametroId], responses: { 200: { description: 'OK' } } } },
    '/auditoria': { get: { tags: ['Auditoría'], summary: 'Historial de acciones (admin)', security: seguro, parameters: [...consultaPaginada, { name: 'entidad', in: 'query', schema: { type: 'string' } }], responses: { 200: { description: 'OK' } } } },
  },
};
