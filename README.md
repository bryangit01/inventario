# Sistema de inventario v2

Node.js + Express + MySQL (backend) y Angular 18 (frontend). Esta versión agrega los 5 pasos para llevarlo a nivel empresarial.

| Paso | Qué agrega | Dónde mirar |
|---|---|---|
| 1 | Login, roles (admin / almacenista / lector), auditoría, borrado lógico, validación con Zod, helmet y límite de peticiones | `backend/src/middlewares`, `validators`, `controllers/auth.controller.js`, `frontend/src/app/core` |
| 2 | Kardex: historial de movimientos (entradas, salidas, ajustes) con transacciones | `models/movimiento.model.js`, `pages/movimientos`, `pages/productos/movimiento-modal.component.ts` |
| 3 | Categorías, proveedores, SKU, precios y stock mínimo por producto | `models/catalogo.model.js`, `pages/catalogo`, `pages/productos/producto-form.*` |
| 4 | Paginación y orden en el servidor, importar CSV, exportar a Excel y panel con gráficas | `models/producto.model.js`, `utils/csv.ts`, `pages/dashboard` |
| 5 | Docker, pruebas automáticas y documentación Swagger | `docker-compose.yml`, `backend/tests`, `backend/src/docs/openapi.js` |

## Estructura

```
inventario/
├── docker-compose.yml
├── backend/
│   ├── database/
│   │   ├── schema.sql                  ← instalación nueva (todas las tablas)
│   │   └── migracion_v1_a_v2.sql       ← si ya tienes la v1 con datos
│   ├── tests/                          ← pruebas (Jest + Supertest)
│   └── src/
│       ├── server.js / app.js          ← arranque y configuración de Express
│       ├── config/db.js                ← pool de MySQL + transacciones
│       ├── routes/                     ← URL + permisos + validación
│       ├── controllers/                ← lógica de cada endpoint
│       ├── models/                     ← todo el SQL
│       ├── validators/schemas.js       ← reglas de validación (Zod)
│       ├── middlewares/                ← autenticación, roles, errores
│       ├── utils/                      ← errores, paginación, envolver async
│       └── docs/openapi.js             ← documentación Swagger
└── frontend/src/app/
    ├── core/                           ← sesión, guards, interceptor, tema
    ├── services/                       ← comunicación con la API
    ├── models/                         ← interfaces TypeScript
    ├── shared/                         ← paginador, confirmar, avisos
    ├── layout/shell.component.ts       ← menú lateral
    ├── pages/                          ← login, panel, productos, catálogos, movimientos, usuarios, auditoría
    └── utils/                          ← lector CSV, descargas
```

## Puesta en marcha (Windows / PowerShell)

### 1. Base de datos (MySQL Workbench)
- **Instalación nueva:** ejecuta `backend/database/schema.sql`.
- **Ya tienes la v1 y quieres conservar los productos:** ejecuta `backend/database/migracion_v1_a_v2.sql` (una sola vez).
- **Ya tienes la v1 pero no te importan los datos de prueba:** ejecuta `DROP DATABASE inventario_db;` y luego `schema.sql`.

### 2. Backend
```powershell
cd backend
npm install
copy .env.example .env
```
Edita `.env`: tu contraseña de MySQL (`DB_PASSWORD`) y una frase larga y secreta en `JWT_SECRET`. Luego:
```powershell
npm run dev
```
La primera vez crea el administrador con `ADMIN_EMAIL` y `ADMIN_PASSWORD` (por defecto `admin@inventario.com` / `Admin12345`). **Cámbiala** desde la pantalla Usuarios después de entrar.

### 3. Frontend (otra terminal)
```powershell
cd frontend
npm install
npm start
```
Abre `http://localhost:4200` e inicia sesión.

### Pruebas y documentación
- `cd backend` → `npm test` (pruebas de validación, seguridad y permisos; no necesitan MySQL).
- Con el backend encendido, abre `http://localhost:3000/api/docs`: pulsa **Authorize**, pega el token que devuelve `POST /auth/login` y prueba los endpoints desde el navegador.

### Con Docker (opcional)
```powershell
docker compose up --build
```
Levanta MySQL (con las tablas ya creadas), la API en el puerto 3000 y Angular en `http://localhost:4200`. Para detener: `docker compose down` (con `-v` borra también los datos).

## Roles

| Acción | admin | almacenista | lector |
|---|:-:|:-:|:-:|
| Ver productos, movimientos, panel | sí | sí | sí |
| Exportar a Excel | sí | sí | sí |
| Crear / editar productos, mover stock, importar CSV | sí | sí | no |
| Crear / editar categorías y proveedores | sí | sí | no |
| Eliminar (papelera), restaurar, eliminar catálogos | sí | no | no |
| Usuarios y auditoría | sí | no | no |

Los permisos se aplican en el **backend** (`permitir('admin', ...)` en cada ruta). El frontend solo oculta botones; la seguridad real nunca depende de él.

## Ideas clave para aprender

**El stock solo cambia con movimientos.** `productos.cantidad` es el resultado; cada cambio queda en `movimientos` con stock anterior y nuevo. Se hace dentro de una transacción con `SELECT ... FOR UPDATE` (ver `movimiento.model.js`), así dos usuarios a la vez no corrompen el stock.

**Una petición, de punta a punta** (ejemplo: botón «Mover stock»):
1. `movimiento-modal.component.ts` → `MovimientoService.registrar()` → `POST /api/movimientos`.
2. El interceptor agrega el token. En el backend: `autenticar` → `permitir('admin','almacenista')` → `validar(schemas.movimiento)`.
3. `movimiento.controller.js` llama a `MovimientoModel.registrar()` (transacción) y deja una fila en `auditoria`.
4. La API devuelve `{ movimiento, producto }` y la pantalla actualiza la fila.

**Borrado lógico.** «Eliminar» solo marca `eliminado_en`; el producto va a la papelera y conserva su historial. Un admin puede restaurarlo.

**Importar CSV.** Columnas: `sku, nombre, descripcion, categoria, proveedor, cantidad, stock_minimo, precio_costo, precio_venta` (botón «Plantilla CSV»). Acepta separador `,` o `;`. Las categorías y proveedores que no existan se crean; una fila con error no detiene a las demás y al final se muestra un resumen. Los decimales van con punto (`59.90`).

## Cómo agregar cosas nuevas

**Un campo nuevo en productos** (ej. `ubicacion`): columna en SQL → `COLUMNAS_INSERT`, `crear` y `actualizar` en `producto.model.js` → esquema `producto` en `schemas.js` → interfaz `producto.model.ts` → `producto-form.component.*` → columna en `productos.component.html`.

**Un catálogo nuevo** (ej. marcas): tabla SQL → `models/marca.model.js` (una línea con `crearModeloCatalogo`) → `routes/marca.routes.js` (copia `categoria.routes.js`) → esquema → `app.use('/api/marcas', ...)` en `app.js` → entrada en `CONFIGS` de `catalogo.component.ts` + ruta en `app.routes.ts`.

**Un endpoint nuevo:** ruta → (permisos, validación) → controlador → modelo, y agrégalo a `docs/openapi.js`.

**Moneda:** `frontend/src/environments/environment.ts` (`moneda: 'USD'`, cámbiala por `COP`, `EUR`, `MXN`...).

## Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| `Cannot find module ...` | Falta `npm install` en esa carpeta (backend y frontend, cada una). |
| Backend: `Falta JWT_SECRET` | Pon `JWT_SECRET` en `backend/.env` (mínimo 16 caracteres) y reinicia. |
| `Unknown column 'sku'` / `Table ... doesn't exist` | No ejecutaste `schema.sql` ni la migración v1→v2. |
| `ER_ACCESS_DENIED_ERROR` | Usuario o contraseña de MySQL incorrectos en `.env`. |
| `Client does not support authentication protocol` | En Workbench: `ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_contraseña'; FLUSH PRIVILEGES;` |
| Login: «No pudimos conectar con el servidor» | El backend no está encendido o el puerto no coincide con `environment.ts`. |
| Error de CORS | `FRONTEND_URL` en `.env` debe ser exactamente `http://localhost:4200`. Reinicia el backend. |
| «Demasiados intentos» al iniciar sesión | Límite de 10 intentos cada 15 minutos por IP; espera o reinicia el backend en desarrollo. |
| Mi sesión se cierra sola | El token dura 8 horas (`JWT_EXPIRA` en `.env`). |

## Siguientes pasos naturales

Varias bodegas con transferencias, órdenes de compra y venta que generen movimientos solas, conteos físicos por lote, lotes y vencimientos, TypeScript en el backend, capa de servicios entre controladores y modelos, migraciones con Knex o Prisma, pruebas de Angular y CI con GitHub Actions.
