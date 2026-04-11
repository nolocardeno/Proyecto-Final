// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Routes } from '@angular/router';

// --------------------------------------------------------------------------
// RUTAS DE LA APLICACIÓN
// --------------------------------------------------------------------------
export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing-page/landing-page').then((m) => m.LandingPageComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'groups',
    loadComponent: () =>
      import('./pages/groups/groups').then(
        (m) => m.GroupsComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/settings/settings').then(
        (m) => m.SettingsComponent,
      ),
  },
];
