// =====================================================================
//  Interceptor HTTP  →  Se ejecuta en CADA petición al servidor
// =====================================================================
//  1) Agrega el header "Authorization: Bearer <token>".
//  2) Si el servidor responde 401 (sesión vencida), cierra la sesión y
//     manda al usuario al login.
// =====================================================================
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const peticion = auth.token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${auth.token}` } })
    : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.cerrarSesion();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
