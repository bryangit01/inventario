// Pruebas de la API que NO necesitan base de datos: se detienen en la seguridad
// y la validación, antes de llegar a MySQL.
process.env.JWT_SECRET = 'secreto_de_pruebas_muy_largo_123456';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

const tokenDe = (rol) =>
  jwt.sign({ id: 1, nombre: 'Prueba', email: 'p@p.com', rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

describe('API: seguridad y validación', () => {
  test('GET /api responde', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
  });

  test('sin token no se puede listar productos', async () => {
    const res = await request(app).get('/api/productos');
    expect(res.status).toBe(401);
  });

  test('un token falso es rechazado', async () => {
    const res = await request(app).get('/api/productos').set('Authorization', 'Bearer falso');
    expect(res.status).toBe(401);
  });

  test('un lector no puede crear productos', async () => {
    const res = await request(app)
      .post('/api/productos')
      .set('Authorization', `Bearer ${tokenDe('lector')}`)
      .send({ nombre: 'Algo' });
    expect(res.status).toBe(403);
  });

  test('un almacenista no puede eliminar productos', async () => {
    const res = await request(app)
      .delete('/api/productos/1')
      .set('Authorization', `Bearer ${tokenDe('almacenista')}`);
    expect(res.status).toBe(403);
  });

  test('solo el admin ve la lista de usuarios', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', `Bearer ${tokenDe('almacenista')}`);
    expect(res.status).toBe(403);
  });

  test('el login rechaza datos mal formados', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'no-es-correo', password: '' });
    expect(res.status).toBe(400);
  });

  test('un movimiento inválido devuelve 400 antes de tocar la base de datos', async () => {
    const res = await request(app)
      .post('/api/movimientos')
      .set('Authorization', `Bearer ${tokenDe('admin')}`)
      .send({ producto_id: 1, tipo: 'salida', cantidad: 0 });
    expect(res.status).toBe(400);
  });

  test('rutas inexistentes devuelven 404', async () => {
    const res = await request(app).get('/api/nada');
    expect(res.status).toBe(404);
  });
});
