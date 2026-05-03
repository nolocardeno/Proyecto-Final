// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// --------------------------------------------------------------------------
// GUARD: Redirige al dashboard si ya hay sesión activa
// --------------------------------------------------------------------------

/**
 * Guard funcional usado en rutas públicas (p. ej. landing).
 *
 * Si el usuario ya está autenticado, redirige automáticamente al
 * dashboard devolviendo un `UrlTree`. Si no, permite el acceso a la ruta.
 */
export const authRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
