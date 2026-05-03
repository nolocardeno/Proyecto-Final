// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, input, output } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: FORM RADIO (Reusable)
// --------------------------------------------------------------------------

/**
 * Botón de radio reutilizable. El estado «seleccionado» se calcula con
 * `computed()` comparando `value` con `selectedValue`, de modo que los
 * cambios en el padre se reflejan automáticamente en la UI.
 */
@Component({
  selector: 'app-form-radio',
  imports: [],
  templateUrl: './form-radio.html',
  styleUrl: './form-radio.scss',
})
export class FormRadioComponent {
  /** Etiqueta visible del radio. */
  label = input.required<string>();
  /** Identificador HTML del input. */
  radioId = input.required<string>();
  /** Nombre del grupo de radios (deben compartirlo). */
  name = input.required<string>();
  /** Valor que representa este radio. */
  value = input.required<string>();
  /** Valor actualmente seleccionado en el grupo. */
  selectedValue = input<string | null>(null);
  /** Si es `true`, el control queda inhabilitado. */
  disabled = input<boolean>(false);

  /** Emite el valor del radio al ser seleccionado. */
  selected = output<string>();

  /** Indica si este radio está seleccionado actualmente. */
  protected readonly checked = computed(() => this.selectedValue() === this.value());

  /** Manejador del evento `click`: emite la selección al padre. */
  protected onSelect(): void {
    if (this.disabled() || this.checked()) return;
    this.selected.emit(this.value());
  }
}
