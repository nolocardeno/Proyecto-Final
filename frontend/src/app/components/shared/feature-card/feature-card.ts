// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --------------------------------------------------------------------------
// COMPONENTE: FEATURE CARD (Reutilizable)
// --------------------------------------------------------------------------

/**
 * Tarjeta tipo flip-card usada en la landing page. Mantiene el estado
 * «volteado/no volteado» mediante un `signal` y expone `toggle()` para
 * alternar la cara visible al hacer clic.
 */
@Component({
  selector: 'app-feature-card',
  imports: [FaIconComponent],
  templateUrl: './feature-card.html',
  styleUrl: './feature-card.scss',
})
export class FeatureCardComponent {
  /** Icono FontAwesome mostrado en la cara frontal. */
  icon = input.required<IconDefinition>();
  /** Título de la tarjeta. */
  text = input.required<string>();
  /** Descripción mostrada en la cara trasera. */
  description = input.required<string>();
  /** Estado de volteo de la tarjeta. */
  flipped = signal(false);

  /** Alterna la cara visible (front/back). */
  toggle(): void {
    this.flipped.update((v) => !v);
  }
}
