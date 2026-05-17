// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

// --------------------------------------------------------------------------
// INTERCEPTOR: AuthInterceptor
// --------------------------------------------------------------------------

/**
 * Interceptor funcional que:
 *  1. Añade el header `Authorization: Bearer <jwt>` a todas las peticiones
 *     salientes hacia la API, salvo las de autenticación (`/api/auth/**`)
 *     y las llamadas externas.
 *  2. Captura respuestas 401 de la API (token expirado o revocado en
 *     servidor) y cierra la sesión local redirigiendo a la landing page,
 *     evitando que el usuario quede atrapado en el dashboard sin datos.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();

  const isApi = req.url.startsWith('/api/');
  const isAuthEndpoint = req.url.startsWith('/api/auth/');

  const outgoing =
    !token || !isApi || isAuthEndpoint
      ? req
      : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(outgoing).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 en un endpoint protegido = token expirado/revocado en servidor.
      // Limpiamos la sesión local y enviamos al usuario a la landing page.
      if (err.status === 401 && !isAuthEndpoint) {
        auth.logout();
        router.navigateByUrl('/');
      }
      return throwError(() => err);
    }),
  );
};
