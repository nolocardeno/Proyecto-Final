// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// --------------------------------------------------------------------------
// GUARD: Redirige al dashboard si ya hay sesión activa
// --------------------------------------------------------------------------
export const authRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.createUrlTree(['/dashboard']);
  }

  return true;
};
