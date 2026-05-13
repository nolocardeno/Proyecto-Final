// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { authRedirectGuard } from './guards/auth-redirect.guard';

// --------------------------------------------------------------------------
// RUTAS DE LA APLICACIÓN
// --------------------------------------------------------------------------
export const routes: Routes = [
  {
    path: '',
    title: 'Inicio',
    canActivate: [authRedirectGuard],
    loadComponent: () =>
      import('./pages/landing-page/landing-page').then((m) => m.LandingPageComponent),
  },
  {
    path: 'dashboard',
    title: 'Dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'groups',
    title: 'Grupos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/groups/groups').then(
        (m) => m.GroupsComponent,
      ),
  },
  {
    path: 'groups/:id',
    title: 'Detalle del grupo',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/group-detail/group-detail').then(
        (m) => m.GroupDetailComponent,
      ),
  },
  {
    path: 'validator',
    title: 'Validador',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/validator/validator').then(
        (m) => m.ValidatorComponent,
      ),
  },
  {
    path: 'documents/:id',
    title: 'Documento',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/document-detail/document-detail').then(
        (m) => m.DocumentDetailComponent,
      ),
  },
  {
    path: 'settings',
    title: 'Configuración',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/settings/settings').then(
        (m) => m.SettingsComponent,
      ),
  },
  {
    path: 'terms',
    title: 'Términos y condiciones',
    loadComponent: () =>
      import('./pages/legal/terms/terms').then((m) => m.TermsComponent),
  },
  {
    path: 'privacy',
    title: 'Política de privacidad',
    loadComponent: () =>
      import('./pages/legal/privacy/privacy').then((m) => m.PrivacyComponent),
  },
  {
    path: 'cookies',
    title: 'Política de cookies',
    loadComponent: () =>
      import('./pages/legal/cookies/cookies').then((m) => m.CookiesComponent),
  },
];
