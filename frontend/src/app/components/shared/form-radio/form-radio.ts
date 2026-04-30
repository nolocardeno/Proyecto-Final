// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, input, output } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: FORM RADIO (Reusable)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-form-radio',
  imports: [],
  templateUrl: './form-radio.html',
  styleUrl: './form-radio.scss',
})
export class FormRadioComponent {
  label = input.required<string>();
  radioId = input.required<string>();
  name = input.required<string>();
  value = input.required<string>();
  selectedValue = input<string | null>(null);
  disabled = input<boolean>(false);

  selected = output<string>();

  protected readonly checked = computed(() => this.selectedValue() === this.value());

  protected onSelect(): void {
    if (this.disabled() || this.checked()) return;
    this.selected.emit(this.value());
  }
}
