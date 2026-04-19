// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, model } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --------------------------------------------------------------------------
// INTERFAZ: Tab
// --------------------------------------------------------------------------
export interface Tab {
  key: string;
  label: string;
  icon: IconDefinition;
}

// --------------------------------------------------------------------------
// COMPONENTE: TAB BAR (Barra de pestañas reutilizable)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-tab-bar',
  imports: [FaIconComponent],
  templateUrl: './tab-bar.html',
  styleUrl: './tab-bar.scss',
})
export class TabBarComponent {
  tabs = input.required<Tab[]>();
  activeTab = model.required<string>();
  ariaLabel = input('Pestañas');

  selectTab(key: string): void {
    this.activeTab.set(key);
  }
}
