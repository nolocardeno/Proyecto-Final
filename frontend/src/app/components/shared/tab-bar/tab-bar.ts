// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, model } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --------------------------------------------------------------------------
// INTERFAZ: Tab
// --------------------------------------------------------------------------

/** Configuración mínima de cada pestaña renderizada en la barra. */
export interface Tab {
  key: string;
  label: string;
  icon: IconDefinition;
}

// --------------------------------------------------------------------------
// COMPONENTE: TAB BAR (Barra de pestañas reutilizable)
// --------------------------------------------------------------------------

/**
 * Barra de pestañas reutilizable. La pestaña activa se expone con
 * `model.required()` para permitir two-way binding desde el padre.
 */
@Component({
  selector: 'app-tab-bar',
  imports: [FaIconComponent],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
})
export class TabBarComponent {
  /** Lista de pestañas a renderizar. */
  tabs = input.required<Tab[]>();
  /** Clave de la pestaña actualmente activa (two-way). */
  activeTab = model.required<string>();
  /** Etiqueta accesible de la barra (aria-label). */
  ariaLabel = input('Pestañas');

  /** Cambia la pestaña activa al hacer clic en una de las opciones. */
  selectTab(key: string): void {
    this.activeTab.set(key);
  }
}
