// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, signal } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: ACCORDION ITEM (Reutilizable)
// --------------------------------------------------------------------------

/**
 * Ítem de un acordeón. Mantiene su estado de apertura mediante un
 * `signal` y expone el método `toggle()` que se asocia al evento `click`
 * de la cabecera en la plantilla.
 */
@Component({
  selector: 'app-accordion-item',
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
})
export class AccordionItemComponent {
  /** Pregunta visible en la cabecera del item. */
  question = input.required<string>();
  /** Estado abierto/cerrado del item (signal reactivo). */
  open = signal(false);

  /** Alterna la visibilidad del contenido del acordeón. */
  toggle(): void {
    this.open.update((v) => !v);
  }
}
