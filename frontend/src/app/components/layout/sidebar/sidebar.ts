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

  currentPage = input<SidebarPage>('Default');
  onNavigate = output<string>();

  navigate(page: string): void {
    // Cierra el drawer (sólo tiene efecto en <lg) tras seleccionar una opción.
    this.sidebarSvc.close();
    this.onNavigate.emit(page);
  }

  closeDrawer(): void {
    this.sidebarSvc.close();
  }
}
