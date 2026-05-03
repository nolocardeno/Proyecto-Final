// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: PROGRESS BAR (Barra de progreso reutilizable)
// --------------------------------------------------------------------------

/**
 * Barra de progreso reutilizable con dos variantes visuales y dos
 * tamaños predefinidos. El valor se interpreta como porcentaje (0-100).
 */
@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class ProgressBarComponent {
  /** Porcentaje de progreso (0-100). */
  value = input.required<number>();
  /** Variante de color: 'default' o 'orange'. */
  variant = input<'default' | 'orange'>('default');
  /** Tamaño de la barra: 'md' (0.875rem) o 'sm' (0.5rem). */
  size = input<'md' | 'sm'>('md');
}
