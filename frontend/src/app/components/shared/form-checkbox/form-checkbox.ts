// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: FORM CHECKBOX (Reusable with ControlValueAccessor)
// --------------------------------------------------------------------------

/**
 * Casilla de verificación personalizada que implementa
 * `ControlValueAccessor` para integrarse con Reactive Forms igual que un
 * checkbox nativo. El estado se alterna con el método `toggle()`,
 * vinculado al evento `click` en la plantilla.
 */
@Component({
  selector: 'app-form-checkbox',
  imports: [FaIconComponent],
  templateUrl: './form-checkbox.html',
  styleUrl: './form-checkbox.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormCheckboxComponent),
      multi: true,
    },
  ],
})
export class FormCheckboxComponent implements ControlValueAccessor {
  /** Etiqueta de texto que acompaña a la casilla. */
  label = input.required<string>();
  /** Identificador HTML del checkbox (asocia el `<label>`). */
  checkboxId = input.required<string>();

  protected readonly faCheck = faCheck;

  protected checked = false;
  protected disabled = false;

  private onChange: (value: boolean) => void = () => {};
  private onTouched: () => void = () => {};

  /** Hook de `ControlValueAccessor`: aplica el valor desde el formulario. */
  writeValue(value: boolean): void {
    this.checked = value ?? false;
  }

  /** Registra el callback que notifica cambios al formulario. */
  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  /** Registra el callback que marca el control como tocado. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** Habilita/deshabilita el control según el FormControl asociado. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Alterna el estado de la casilla y propaga el cambio al formulario. */
  protected toggle(): void {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.onChange(this.checked);
    this.onTouched();
  }
}
