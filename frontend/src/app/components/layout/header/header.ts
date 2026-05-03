// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../../shared/button/button';
import { ThemeToggleComponent } from '../../shared/theme-toggle/theme-toggle';
import { UserCardComponent } from '../../shared/user-card/user-card';
import { AuthModalService } from '../../../services/auth-modal.service';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

// --------------------------------------------------------------------------
// COMPONENTE: HEADER
// --------------------------------------------------------------------------

/**
 * Cabecera global de la aplicación. Contiene la marca, el switch de
 * tema, el botón de hamburguesa que controla el drawer del sidebar y
 * la tarjeta de usuario / botones de autenticación según el estado de
 * sesión.
 */
@Component({
  selector: 'app-header',
  imports: [RouterLink, ButtonComponent, ThemeToggleComponent, UserCardComponent, FaIconComponent],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class HeaderComponent {
  protected readonly authModal = inject(AuthModalService);
  protected readonly authService = inject(AuthService);
  protected readonly sidebar = inject(SidebarService);

  // Iconos del botón hamburguesa (cambia según el estado del drawer)
  protected readonly faBars = faBars;
  protected readonly faXmark = faXmark;
  /** Icono que muestra el botón hamburguesa según el estado del drawer. */
  protected readonly menuIcon = computed(() =>
    this.sidebar.isOpen() ? this.faXmark : this.faBars,
  );
}
