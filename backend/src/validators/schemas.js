// =====================================================================
//  validators/schemas.js  →  Reglas de validación (Zod)
// =====================================================================
//  Cada esquema describe cómo debe verse un dato válido. Zod además lo
//  "limpia": recorta espacios, convierte "5" en 5, pone valores por defecto.
//  Para validar algo nuevo: crea el esquema aquí y úsalo en la ruta con
//  validar(schemas.miEsquema).
// =====================================================================
const { z } = require('zod');

const ROLES = ['admin', 'almacenista', 'lector'];

// Entero positivo opcional que acepta null o '' (para selects "sin categoría")
const idOpcional = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.coerce.number().int().positive().nullable()
);
const textoOpcional = (max) =>
  z.string().trim().max(max).nullish().transform((v) => v || null);
const numeroNoNegativo = (max, porDefecto) =>
  z.coerce.number().min(0, 'No puede ser negativo').max(max).optional().default(porDefecto);

// ---------- Paso 1: autenticación y usuarios ----------
const login = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password: z.string().min(1, 'Escribe tu contraseña'),
});

const password = z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres');

const usuarioCrear = z.object({
  nombre: z.string().trim().min(2, 'Escribe el nombre').max(100),
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  password,
  rol: z.enum(ROLES),
});

const usuarioActualizar = z.object({
  nombre: z.string().trim().min(2).max(100).optional(),
  rol: z.enum(ROLES).optional(),
  activo: z.boolean().optional(),
  password: password.optional(),
});

// ---------- Productos ----------
const producto = z.object({
  sku: textoOpcional(50),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  descripcion: z.string().trim().max(2000).optional().default(''),
  cantidad: z.coerce.number().int().min(0).optional().default(0), // solo se usa al CREAR (stock inicial)
  activo: z.boolean().optional().default(true),
  categoria_id: idOpcional,
  proveedor_id: idOpcional,
  precio_costo: numeroNoNegativo(99999999, 0),
  precio_venta: numeroNoNegativo(99999999, 0),
  stock_minimo: z.coerce.number().int().min(0).max(1000000).optional().default(5),
});

const productoEstado = z.object({ activo: z.boolean({ required_error: 'Envía "activo" como true o false' }) });

const idFiltro = z.coerce.number().int().positive().optional();

const productoListado = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(10),
  buscar: z.string().trim().max(100).default(''),
  estado: z.enum(['todos', 'activos', 'inactivos', 'stock_bajo', 'papelera']).default('todos'),
  categoria_id: idFiltro,
  proveedor_id: idFiltro,
  orden: z.enum(['nombre', 'cantidad', 'precio_venta', 'sku', 'creado_en']).default('creado_en'),
  dir: z.enum(['asc', 'desc']).default('desc'),
});

// Una fila del archivo CSV de importación. Admite categoría y proveedor por NOMBRE.
const productoImportar = z.object({
  sku: textoOpcional(50),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  descripcion: z.string().trim().max(2000).optional().default(''),
  categoria: z.string().trim().max(80).optional().default(''),
  proveedor: z.string().trim().max(120).optional().default(''),
  cantidad: z.coerce.number().int().min(0).optional().default(0),
  stock_minimo: z.coerce.number().int().min(0).optional().default(5),
  precio_costo: numeroNoNegativo(99999999, 0),
  precio_venta: numeroNoNegativo(99999999, 0),
});

const importar = z.object({
  filas: z.array(z.record(z.string(), z.any())).min(1, 'El archivo no tiene filas').max(1000, 'Máximo 1000 filas por archivo'),
});

// ---------- Paso 2: movimientos (kardex) ----------
const movimiento = z
  .object({
    producto_id: z.coerce.number().int().positive(),
    tipo: z.enum(['entrada', 'salida', 'ajuste']),
    cantidad: z.coerce.number().int().min(0, 'No puede ser negativa'),
    motivo: z.string().trim().max(255).optional().default(''),
  })
  .refine((d) => d.tipo === 'ajuste' || d.cantidad >= 1, {
    message: 'La cantidad debe ser al menos 1',
    path: ['cantidad'],
  });

const movimientoListado = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(10),
  producto_id: idFiltro,
  tipo: z.enum(['entrada', 'salida', 'ajuste']).optional(),
});

// ---------- Paso 3: catálogos ----------
const categoria = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  descripcion: z.string().trim().max(255).optional().default(''),
});

const proveedor = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  contacto: z.string().trim().max(120).optional().default(''),
  email: z.string().trim().email('Correo inválido').or(z.literal('')).optional().default(''),
  telefono: z.string().trim().max(40).optional().default(''),
});

// ---------- Auditoría ----------
const auditoriaListado = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(15),
  entidad: z.string().trim().max(40).optional(),
});

module.exports = {
  ROLES, login, usuarioCrear, usuarioActualizar,
  producto, productoEstado, productoListado, productoImportar, importar,
  movimiento, movimientoListado, categoria, proveedor, auditoriaListado,
};
