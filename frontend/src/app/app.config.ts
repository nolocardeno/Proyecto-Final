// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TitleStrategy } from '@angular/router';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { AppTitleStrategy } from './utils/app-title-strategy';

// --------------------------------------------------------------------------
// CONFIGURACIÓN DE LA APLICACIÓN
// --------------------------------------------------------------------------
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ]
};
