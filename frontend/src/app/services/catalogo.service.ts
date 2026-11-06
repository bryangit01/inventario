// CatalogoService → un solo servicio para categorías y proveedores.
// "recurso" es la parte final de la URL: 'categorias' o 'proveedores'.
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Catalogo } from '../models/api.models';

export type RecursoCatalogo = 'categorias' | 'proveedores';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  constructor(private http: HttpClient) {}

  private url(recurso: RecursoCatalogo): string {
    return `${environment.apiUrl}/${recurso}`;
  }

  listar(recurso: RecursoCatalogo): Observable<Catalogo[]> {
    return this.http.get<Catalogo[]>(this.url(recurso));
  }
  crear(recurso: RecursoCatalogo, datos: Catalogo): Observable<Catalogo> {
    return this.http.post<Catalogo>(this.url(recurso), datos);
  }
  actualizar(recurso: RecursoCatalogo, id: number, datos: Catalogo): Observable<Catalogo> {
    return this.http.put<Catalogo>(`${this.url(recurso)}/${id}`, datos);
  }
  eliminar(recurso: RecursoCatalogo, id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.url(recurso)}/${id}`);
  }
}
