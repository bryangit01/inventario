// =====================================================================
//  Guards  →  Porteros de las rutas
// =====================================================================
//  authGuard      : si no hay sesión, redirige al login.
//  rolGuard(...)  : además exige uno de los roles indicados.
//  Se usan en app.routes.ts con  canActivate: [authGuard]
// =====================================================================
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models/api.models';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado ? true : inject(Router).createUrlTree(['/login']);
};

export const rolGuard =
  (...roles: Rol[]): CanActivateFn =>
  () => {
    const auth = inject(AuthService);
    return auth.tieneRol(...roles) ? true : inject(Router).createUrlTree(['/dashboard']);
  };
