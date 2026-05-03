// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: BUTTON (Reutilizable)
// --------------------------------------------------------------------------

/**
 * Botón reutilizable que abstrae los distintos estilos de la aplicación.
 * Recibe variantes visuales y tamaños mediante `input()` (signal-based).
 */
@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class ButtonComponent {
  /** Variante visual del botón. */
  variant = input<'primary' | 'secondary' | 'ghost' | 'text' | 'icon' | 'card'>('primary');
  /** Tamaño predefinido del botón. */
  size = input<'sm' | 'md' | 'lg' | 'auth' | 'cta' | 'full'>('md');
  /** Atributo HTML `type` (relevante dentro de formularios). */
  type = input<'button' | 'submit'>('button');
  /** Si está a `true`, el botón se renderiza deshabilitado. */
  disabled = input<boolean>(false);
}
