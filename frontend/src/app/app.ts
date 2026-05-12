// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HeaderComponent } from './components/layout/header/header';
import { FooterComponent } from './components/layout/footer/footer';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { AuthModalService } from './services/auth-modal.service';
import { AlertsComponent } from './components/shared/alerts/alerts';
import { CookieBannerComponent } from './components/shared/cookie-banner/cookie-banner';
import { ThemeService } from './services/theme.service';

// --------------------------------------------------------------------------
// RUTAS QUE USAN LAYOUT CON SIDEBAR
// --------------------------------------------------------------------------

/** Rutas en las que el layout debe incluir un sidebar lateral. */
const SIDEBAR_ROUTES = ['/dashboard', '/settings', '/groups'];

// --------------------------------------------------------------------------
// COMPONENTE: APP (ROOT)
// --------------------------------------------------------------------------

/**
 * Componente raíz de la aplicación.
 *
 * Compone el layout global (header, footer, alertas y modales de auth) y
 * decide dinámicamente la variante del footer (`with-sidebar` o `default`)
 * suscribiéndose a los eventos `NavigationEnd` del `Router` mediante
 * operadores RxJS y convirtiéndolos en un `signal` con `toSignal`.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    AlertsComponent,
    CookieBannerComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  /** Servicio que controla la visibilidad de los modales de login/registro. */
  protected readonly authModal = inject(AuthModalService);
  // Inyectado para inicializar el tema (lee storage / prefers-color-scheme).
  private readonly theme = inject(ThemeService);

  /** Variante actual del footer derivada de la URL activa. */
  protected readonly footerVariant = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) =>
        SIDEBAR_ROUTES.some((route) => e.urlAfterRedirects.startsWith(route))
          ? ('with-sidebar' as const)
          : ('default' as const),
      ),
    ),
    { initialValue: 'default' as const },
  );
}
