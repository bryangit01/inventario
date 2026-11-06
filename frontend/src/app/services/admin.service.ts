// AdminService → dashboard, usuarios y auditoría (cosas del panel de administración).
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuditoriaItem, Dashboard, Pagina, Rol, Usuario } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  dashboard(): Observable<Dashboard> {
    return this.http.get<Dashboard>(`${this.base}/dashboard`);
  }

  usuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.base}/usuarios`);
  }
  crearUsuario(u: { nombre: string; email: string; password: string; rol: Rol }): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.base}/usuarios`, u);
  }
  actualizarUsuario(id: number, cambios: Partial<{ nombre: string; rol: Rol; activo: boolean; password: string }>): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.base}/usuarios/${id}`, cambios);
  }

  auditoria(pagina: number, limite: number, entidad?: string): Observable<Pagina<AuditoriaItem>> {
    let params = new HttpParams().set('pagina', pagina).set('limite', limite);
    if (entidad) params = params.set('entidad', entidad);
    return this.http.get<Pagina<AuditoriaItem>>(`${this.base}/auditoria`, { params });
  }
}
