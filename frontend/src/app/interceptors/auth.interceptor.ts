// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthService } from '../services/auth.service';

// --------------------------------------------------------------------------
// INTERCEPTOR: AuthInterceptor
// --------------------------------------------------------------------------

/**
 * Interceptor funcional que añade el header `Authorization: Bearer <jwt>` a
 * todas las peticiones salientes hacia la API, salvo las de autenticación
 * (`/api/auth/**`) y las llamadas externas.
 *
 * Sustituye al antiguo header propio `X-User-Id`, que ya no es seguro
 * porque el cliente lo controlaba completamente.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  const isApi = req.url.startsWith('/api/');
  const isAuthEndpoint = req.url.startsWith('/api/auth/');

  if (!token || !isApi || isAuthEndpoint) {
    return next(req);
  }

  const cloned = req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  });
  return next(cloned);
};
