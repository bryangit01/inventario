// =====================================================================
//  AuthService  →  Sesión del usuario
// =====================================================================
//  Guarda el token y los datos del usuario en localStorage para que la
//  sesión sobreviva si recargas la página. El interceptor agrega el token
//  a cada petición; los guards usan este servicio para proteger rutas.
// =====================================================================
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol, Usuario } from '../models/api.models';

const CLAVE_TOKEN = 'inventario_token';
const CLAVE_USUARIO = 'inventario_usuario';

@Injectable({ providedIn: 'root' })
export class AuthService {
  token: string | null = localStorage.getItem(CLAVE_TOKEN);
  usuario: Usuario | null = this.leerUsuario();

  constructor(private http: HttpClient) {}

  get autenticado(): boolean {
    return !!this.token && !!this.usuario;
  }
  get esAdmin(): boolean {
    return this.usuario?.rol === 'admin';
  }
  /** Admin y almacenista pueden crear y editar; el lector solo mira. */
  get puedeEscribir(): boolean {
    return this.tieneRol('admin', 'almacenista');
  }

  tieneRol(...roles: Rol[]): boolean {
    return !!this.usuario && roles.includes(this.usuario.rol);
  }

  login(email: string, password: string): Observable<{ token: string; usuario: Usuario }> {
    return this.http
      .post<{ token: string; usuario: Usuario }>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap((respuesta) => {
          this.token = respuesta.token;
          this.usuario = respuesta.usuario;
          localStorage.setItem(CLAVE_TOKEN, respuesta.token);
          localStorage.setItem(CLAVE_USUARIO, JSON.stringify(respuesta.usuario));
        })
      );
  }

  cerrarSesion(): void {
    this.token = null;
    this.usuario = null;
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_USUARIO);
  }

  private leerUsuario(): Usuario | null {
    try {
      return JSON.parse(localStorage.getItem(CLAVE_USUARIO) ?? 'null');
    } catch {
      return null;
    }
  }
}
