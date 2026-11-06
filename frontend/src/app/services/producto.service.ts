// =====================================================================
//  ProductoService  →  Comunicación con /api/productos
// =====================================================================
//  Los componentes no usan HttpClient directamente: usan este servicio.
//  Cada método devuelve un Observable; el componente hace .subscribe().
// =====================================================================
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Pagina } from '../models/api.models';
import { FiltrosProducto, Producto, ResultadoImportacion } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private url = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  /** Lista paginada. Solo se envían los filtros que tienen valor. */
  listar(f: FiltrosProducto): Observable<Pagina<Producto>> {
    let params = new HttpParams()
      .set('pagina', f.pagina)
      .set('limite', f.limite)
      .set('estado', f.estado)
      .set('orden', f.orden)
      .set('dir', f.dir);
    if (f.buscar) params = params.set('buscar', f.buscar);
    if (f.categoria_id) params = params.set('categoria_id', f.categoria_id);
    if (f.proveedor_id) params = params.set('proveedor_id', f.proveedor_id);
    return this.http.get<Pagina<Producto>>(this.url, { params });
  }

  crear(p: Producto): Observable<Producto> {
    return this.http.post<Producto>(this.url, p);
  }
  actualizar(id: number, p: Producto): Observable<Producto> {
    return this.http.put<Producto>(`${this.url}/${id}`, p);
  }
  cambiarEstado(id: number, activo: boolean): Observable<Producto> {
    return this.http.patch<Producto>(`${this.url}/${id}/estado`, { activo });
  }
  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url}/${id}`);
  }
  restaurar(id: number): Observable<Producto> {
    return this.http.post<Producto>(`${this.url}/${id}/restaurar`, {});
  }
  exportar(): Observable<Blob> {
    return this.http.get(`${this.url}/exportar`, { responseType: 'blob' });
  }
  importar(filas: Record<string, string>[]): Observable<ResultadoImportacion> {
    return this.http.post<ResultadoImportacion>(`${this.url}/importar`, { filas });
  }
}
