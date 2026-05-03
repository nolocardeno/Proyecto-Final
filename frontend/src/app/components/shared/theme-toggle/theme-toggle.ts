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

/**
 * Switch deslizante (`role="switch"`) que alterna entre tema claro y
 * oscuro mediante el `ThemeService`. El icono del thumb se calcula con
 * `computed()` en función del estado actual del tema.
 */
@Component({
  selector: 'app-theme-toggle',
  imports: [FaIconComponent],
  templateUrl: './theme-toggle.html',
  styleUrl: './theme-toggle.scss',
})
export class ThemeToggleComponent {
  protected readonly theme = inject(ThemeService);

  /** Icono mostrado dentro del thumb en función del tema activo. */
  protected readonly icon = computed(() => (this.theme.isDark() ? faMoon : faSun));

  /** Etiqueta accesible del switch (aria-label dinámico). */
  protected readonly label = computed(() =>
    this.theme.isDark() ? 'Activar tema claro' : 'Activar tema oscuro',
  );
}
