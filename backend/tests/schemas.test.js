// Pruebas de los esquemas de validación (no necesitan base de datos).
const schemas = require('../src/validators/schemas');

describe('esquema producto', () => {
  test('aplica valores por defecto y limpia los datos', () => {
    const r = schemas.producto.parse({ nombre: '  Teclado  ', cantidad: '5' });
    expect(r.nombre).toBe('Teclado');
    expect(r.cantidad).toBe(5);
    expect(r.activo).toBe(true);
    expect(r.stock_minimo).toBe(5);
    expect(r.categoria_id).toBeNull();
    expect(r.sku).toBeNull();
  });

  test('rechaza nombre vacío y cantidad negativa', () => {
    expect(schemas.producto.safeParse({ nombre: '' }).success).toBe(false);
    expect(schemas.producto.safeParse({ nombre: 'X', cantidad: -1 }).success).toBe(false);
  });

  test('convierte "" en null para categoría', () => {
    const r = schemas.producto.parse({ nombre: 'X', categoria_id: '' });
    expect(r.categoria_id).toBeNull();
  });
});

describe('esquema movimiento', () => {
  test('una salida necesita al menos 1 unidad', () => {
    expect(schemas.movimiento.safeParse({ producto_id: 1, tipo: 'salida', cantidad: 0 }).success).toBe(false);
  });
  test('un ajuste puede dejar el stock en 0', () => {
    expect(schemas.movimiento.safeParse({ producto_id: 1, tipo: 'ajuste', cantidad: 0 }).success).toBe(true);
  });
  test('rechaza tipos desconocidos', () => {
    expect(schemas.movimiento.safeParse({ producto_id: 1, tipo: 'robo', cantidad: 1 }).success).toBe(false);
  });
});

describe('esquema login', () => {
  test('pasa el correo a minúsculas', () => {
    const r = schemas.login.parse({ email: ' ADMIN@Inventario.com ', password: 'x' });
    expect(r.email).toBe('admin@inventario.com');
  });
});

describe('esquema listado de productos', () => {
  test('usa paginación por defecto y limita el tamaño de página', () => {
    const r = schemas.productoListado.parse({});
    expect(r.pagina).toBe(1);
    expect(r.limite).toBe(10);
    expect(schemas.productoListado.safeParse({ limite: 5000 }).success).toBe(false);
  });
});
