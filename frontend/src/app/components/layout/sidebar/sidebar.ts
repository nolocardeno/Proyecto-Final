// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, input, output } from '@angular/core';
import { SidebarButtonComponent } from '../../shared/sidebar-button/sidebar-button';
import { SidebarService } from '../../../services/sidebar.service';

// --------------------------------------------------------------------------
// TIPO: Navigation pages
// --------------------------------------------------------------------------
export type SidebarPage =
  | 'Dashboard'
  | 'Groups'
  | 'Validator'
  | 'Settings'
  | 'Default';

// --------------------------------------------------------------------------
// COMPONENTE: SIDEBAR
// --------------------------------------------------------------------------

/**
 * Menú lateral. En escritorio está fijo; en móvil actúa como drawer
 * controlado por `SidebarService`. Renderiza un `SidebarButtonComponent`
 * por cada sección y emite `onNavigate` al seleccionar una opción.
 */
@Component({
  selector: 'app-sidebar',
  imports: [SidebarButtonComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  host: {
    '[class.sidebar-host--open]': 'sidebarSvc.isOpen()',
  },
})
export class SidebarComponent {
  protected readonly sidebarSvc = inject(SidebarService);

  /** Identificador de la página actualmente activa. */
  currentPage = input<SidebarPage>('Default');
  /** Emitido al hacer clic en una opción del menú. */
  onNavigate = output<string>();

  /** Cierra el drawer (sólo tiene efecto en <lg) y emite `onNavigate`. */
  navigate(page: string): void {
    this.sidebarSvc.close();
    this.onNavigate.emit(page);
  }

  /** Cierra el drawer sin navegar. */
  closeDrawer(): void {
    this.sidebarSvc.close();
  }
}
