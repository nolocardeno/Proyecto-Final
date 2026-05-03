// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// --------------------------------------------------------------------------
// COMPONENTE: FORM FIELD (Reusable input with ControlValueAccessor)
// --------------------------------------------------------------------------

/**
 * Campo de formulario reutilizable que implementa `ControlValueAccessor`
 * para integrarse de forma transparente con Reactive Forms.
 *
 * Expone los hooks de Angular (`writeValue`, `registerOnChange`,
 * `registerOnTouched`, `setDisabledState`) y captura los eventos `input`
 * y `blur` del campo nativo subyacente para sincronizar el modelo del
 * formulario padre.
 */
@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldComponent),
      multi: true,
    },
  ],
})
export class FormFieldComponent implements ControlValueAccessor {
  /** Etiqueta visible asociada al campo. */
  label = input<string>('');
  /** Tipo HTML del input (text, email, password, date, ...). */
  type = input<string>('text');
  /** Identificador HTML del input (necesario para asociarlo al `<label>`). */
  inputId = input.required<string>();
  /** Límite de caracteres aceptados. */
  maxlength = input<number | null>(null);
  /** Si es `true`, el input se renderiza como sólo lectura. */
  readonly = input<boolean>(false);

  protected value = '';
  protected disabled = false;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  /** Hook de `ControlValueAccessor`: recibe el valor desde el formulario. */
  writeValue(value: string): void {
    this.value = value ?? '';
  }

  /** Registra el callback que notifica cambios al formulario padre. */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /** Registra el callback que marca el control como tocado. */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /** Habilita/deshabilita el campo según el estado del FormControl. */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /** Manejador del evento `input` del campo nativo. */
  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  /** Manejador del evento `blur`: marca el control como tocado. */
  protected onBlur(): void {
    this.onTouched();
  }
}
