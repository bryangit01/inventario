// =====================================================================
//  Modelos (interfaces) compartidos. Deben coincidir con lo que devuelve la API.
// =====================================================================
export type Rol = 'admin' | 'almacenista' | 'lector';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo?: boolean;
  creado_en?: string;
}

/** Respuesta paginada estándar de la API. */
export interface Pagina<T> {
  datos: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

/** Categoría o proveedor (los campos extra dependen del catálogo). */
export interface Catalogo {
  id?: number;
  nombre: string;
  [campo: string]: string | number | undefined;
}

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface Movimiento {
  id: number;
  producto_id: number;
  producto: string;
  sku: string | null;
  usuario: string | null;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo: string | null;
  creado_en: string;
}

export interface AuditoriaItem {
  id: number;
  usuario: string | null;
  entidad: string;
  entidad_id: number | null;
  accion: string;
  antes: unknown;
  despues: unknown;
  creado_en: string;
}

export interface Dashboard {
  totales: {
    productos: number;
    unidades: number;
    valor_costo: number;
    valor_venta: number;
    stock_bajo: number;
    agotados: number;
    activos: number;
  };
  porCategoria: { nombre: string; productos: number; unidades: number }[];
  movimientosPorDia: { dia: string; entradas: number; salidas: number }[];
  alertas: { id: number; nombre: string; sku: string | null; cantidad: number; stock_minimo: number }[];
}
