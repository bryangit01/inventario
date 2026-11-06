// MovimientoService → kardex: registrar y consultar movimientos de stock.
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Movimiento, Pagina, TipoMovimiento } from '../models/api.models';
import { Producto } from '../models/producto.model';

@Injectable({ providedIn: 'root' })
export class MovimientoService {
  private url = `${environment.apiUrl}/movimientos`;

  constructor(private http: HttpClient) {}

  listar(filtros: { pagina: number; limite: number; producto_id?: number; tipo?: string }): Observable<Pagina<Movimiento>> {
    let params = new HttpParams().set('pagina', filtros.pagina).set('limite', filtros.limite);
    if (filtros.producto_id) params = params.set('producto_id', filtros.producto_id);
    if (filtros.tipo) params = params.set('tipo', filtros.tipo);
    return this.http.get<Pagina<Movimiento>>(this.url, { params });
  }

  registrar(datos: {
    producto_id: number;
    tipo: TipoMovimiento;
    cantidad: number;
    motivo: string;
  }): Observable<{ movimiento: Movimiento; producto: Producto }> {
    return this.http.post<{ movimiento: Movimiento; producto: Producto }>(this.url, datos);
  }
}
