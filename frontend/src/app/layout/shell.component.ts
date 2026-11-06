// =====================================================================
//  ShellComponent  →  Marco de la app: menú lateral + zona de contenido
// =====================================================================
//  Los enlaces que ve cada usuario dependen de su rol.
// =====================================================================
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { TemaService } from '../core/tema.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app">
      <aside class="lateral">
        <div class="lateral-marca">
          <span class="logo" aria-hidden="true"></span>
          <span class="marca">Inventario</span>
        </div>

        <nav class="lateral-nav" aria-label="Principal">
          <a routerLink="/dashboard" routerLinkActive="activo" class="nav-link">Panel</a>
          <a routerLink="/productos" routerLinkActive="activo" class="nav-link">Productos</a>
          <a routerLink="/movimientos" routerLinkActive="activo" class="nav-link">Movimientos</a>
          <a routerLink="/categorias" routerLinkActive="activo" class="nav-link">Categorías</a>
          <a routerLink="/proveedores" routerLinkActive="activo" class="nav-link">Proveedores</a>
          @if (auth.esAdmin) {
            <a routerLink="/usuarios" routerLinkActive="activo" class="nav-link">Usuarios</a>
            <a routerLink="/auditoria" routerLinkActive="activo" class="nav-link">Auditoría</a>
          }
        </nav>

        <div class="lateral-pie">
          <div class="usuario-caja">
            <strong>{{ auth.usuario?.nombre }}</strong>
            <span>{{ auth.usuario?.rol }}</span>
          </div>
          <button type="button" class="btn btn-lateral" (click)="tema.alternar()">
            {{ tema.oscuro ? 'Modo claro' : 'Modo oscuro' }}
          </button>
          <button type="button" class="btn btn-lateral" (click)="salir()">Cerrar sesión</button>
        </div>
      </aside>

      <main class="contenido">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  constructor(
    public auth: AuthService,
    public tema: TemaService,
    private router: Router
  ) {}

  salir(): void {
    this.auth.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
