// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// --------------------------------------------------------------------------
// GUARD: Protege rutas que requieren autenticación
// --------------------------------------------------------------------------

/**
 * Guard funcional usado en rutas privadas (p. ej. dashboard, groups).
 *
 * Si el usuario no está autenticado, redirige automáticamente a la
 * landing page devolviendo un `UrlTree`. Si está autenticado, permite
 * el acceso a la ruta.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/']);
  }

  return true;
};
