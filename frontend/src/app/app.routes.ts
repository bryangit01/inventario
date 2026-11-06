// =====================================================================
//  app.routes.ts  →  Mapa de pantallas
// =====================================================================
//  Todo lo que está dentro del Shell (menú lateral) exige sesión.
//  Usuarios y Auditoría, además, exigen rol admin.
// =====================================================================
import { Routes } from '@angular/router';
import { authGuard, rolGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { CatalogoComponent } from './pages/catalogo/catalogo.component';
import { MovimientosComponent } from './pages/movimientos/movimientos.component';
import { UsuariosComponent } from './pages/usuarios/usuarios.component';
import { AuditoriaComponent } from './pages/auditoria/auditoria.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'categorias', component: CatalogoComponent, data: { recurso: 'categorias' } },
      { path: 'proveedores', component: CatalogoComponent, data: { recurso: 'proveedores' } },
      { path: 'movimientos', component: MovimientosComponent },
      { path: 'usuarios', component: UsuariosComponent, canActivate: [rolGuard('admin')] },
      { path: 'auditoria', component: AuditoriaComponent, canActivate: [rolGuard('admin')] },
    ],
  },
  { path: '**', redirectTo: '' },
];
