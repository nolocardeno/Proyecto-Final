// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBars, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../../shared/button/button';
import { UserCardComponent } from '../../shared/user-card/user-card';
import { AuthModalService } from '../../../services/auth-modal.service';
import { AuthService } from '../../../services/auth.service';
import { SidebarService } from '../../../services/sidebar.service';

// --------------------------------------------------------------------------
// COMPONENTE: HEADER
// --------------------------------------------------------------------------
@Component({
  selector: 'app-header',
  imports: [RouterLink, ButtonComponent, UserCardComponent, FaIconComponent],
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
  protected readonly menuIcon = computed(() =>
    this.sidebar.isOpen() ? this.faXmark : this.faBars,
  );
}
