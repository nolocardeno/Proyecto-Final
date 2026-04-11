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

// --------------------------------------------------------------------------
// RUTAS QUE USAN LAYOUT CON SIDEBAR
// --------------------------------------------------------------------------
const SIDEBAR_ROUTES = ['/dashboard', '/settings', '/groups'];

// --------------------------------------------------------------------------
// COMPONENTE: APP (ROOT)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    LoginComponent,
    RegisterComponent,
    AlertsComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  protected readonly authModal = inject(AuthModalService);

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
