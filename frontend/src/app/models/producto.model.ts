// Interfaz de Producto (forma de los datos). Coincide con la tabla "productos".
export interface Producto {
  id?: number;
  sku: string | null;
  nombre: string;
  descripcion: string;
  cantidad: number;
  activo: boolean;
  categoria_id: number | null;
  proveedor_id: number | null;
  categoria?: string | null; // nombre (viene del JOIN)
  proveedor?: string | null;
  precio_costo: number;
  precio_venta: number;
  stock_minimo: number;
  eliminado_en?: string | null;
  creado_en?: string;
  actualizado_en?: string;
}

/** Parámetros de búsqueda que se envían al servidor. */
export interface FiltrosProducto {
  pagina: number;
  limite: number;
  buscar: string;
  estado: string;
  categoria_id: number | null;
  proveedor_id: number | null;
  orden: string;
  dir: 'asc' | 'desc';
}

export interface ResultadoImportacion {
  creados: number;
  errores: { fila: number; mensaje: string }[];
}
