// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: PROGRESS BAR (Barra de progreso reutilizable)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styleUrl: './progress-bar.scss',
})
export class ProgressBarComponent {
  value = input.required<number>();
  /** 'default' | 'orange' */
  variant = input<'default' | 'orange'>('default');
  /** 'md' (default 0.875rem) | 'sm' (0.5rem) */
  size = input<'md' | 'sm'>('md');
}
