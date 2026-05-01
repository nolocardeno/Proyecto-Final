// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, inject } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { ThemeService } from '../../../services/theme.service';

// --------------------------------------------------------------------------
// COMPONENTE: THEME TOGGLE
// --------------------------------------------------------------------------
// Switch deslizante (role="switch") que conmuta entre tema claro y oscuro.
// El thumb contiene el icono del tema activo y se desliza al pulsar.
// --------------------------------------------------------------------------
@Component({
  selector: 'app-theme-toggle',
  imports: [FaIconComponent],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);

  protected readonly icon = computed(() => (this.theme.isDark() ? faMoon : faSun));

  protected readonly label = computed(() =>
    this.theme.isDark() ? 'Activar tema claro' : 'Activar tema oscuro',
  );
}
