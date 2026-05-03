// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faHouse,
  faUsers,
  faShieldHalved,
  faSliders,
  faRightFromBracket,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// TIPO: Sidebar button variants
// --------------------------------------------------------------------------
export type SidebarButtonType =
  | 'Dashboard'
  | 'Groups'
  | 'Validator'
  | 'Settings'
  | 'Logout';

// --------------------------------------------------------------------------
// CONFIGURATION MAPS
// --------------------------------------------------------------------------
const LABELS: Record<SidebarButtonType, string> = {
  Dashboard: 'Dashboard',
  Groups: 'Grupos',
  Validator: 'Validador',
  Settings: 'Ajustes',
  Logout: 'Cerrar sesión',
};

const ICONS: Record<SidebarButtonType, IconDefinition> = {
  Dashboard: faHouse,
  Groups: faUsers,
  Validator: faShieldHalved,
  Settings: faSliders,
  Logout: faRightFromBracket,
};

// --------------------------------------------------------------------------
// COMPONENTE: SIDEBAR BUTTON
// --------------------------------------------------------------------------

/**
 * Botón del menú lateral. Recibe un identificador `type` y deriva la
 * etiqueta y el icono correspondientes a partir de los mapas
 * `LABELS` e `ICONS` mediante `computed()`.
 */
@Component({
  selector: 'app-sidebar-button',
  imports: [FaIconComponent],
  templateUrl: './sidebar-button.html',
  styleUrl: './sidebar-button.scss',
})
export class SidebarButtonComponent {
  /** Identificador de la opción del menú. */
  type = input.required<SidebarButtonType>();
  /** Indica si el botón está marcado como activo (ruta actual). */
  active = input(false);

  /** Etiqueta visible derivada del tipo. */
  protected readonly label = computed(() => LABELS[this.type()]);
  /** Icono derivado del tipo. */
  protected readonly icon = computed(() => ICONS[this.type()]);
}
