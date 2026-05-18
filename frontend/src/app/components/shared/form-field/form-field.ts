// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, input } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

// --------------------------------------------------------------------------
// COMPONENTE: FORM FIELD (Reusable input with ControlValueAccessor)
// --------------------------------------------------------------------------

/**
 * Campo de formulario reutilizable que implementa `ControlValueAccessor`
 * para integrarse de forma transparente con Reactive Forms.
 *
 * Inyecta `NgControl` directamente (sin `NG_VALUE_ACCESSOR` en providers)
 * para acceder al estado de validación y mostrar mensajes de error inline
 * cuando el campo ha sido tocado y contiene errores.
 */
@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss',
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

  /** Referencia al NgControl del formulario padre para leer errores y estado. */
  private readonly ngControl = inject(NgControl, { self: true, optional: true });

  constructor() {
    // Registra este componente como valueAccessor del NgControl inyectado,
    // evitando la dependencia circular que surgiría con NG_VALUE_ACCESSOR.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  /** ID del elemento de error para aria-describedby. */
  protected get errorId(): string {
    return `${this.inputId()}-error`;
  }

  /** Indica si el campo debe mostrar estado de error. */
  protected get hasError(): boolean {
    return !!(this.ngControl?.touched && this.ngControl.invalid);
  }

  /** Primer mensaje de error legible según el tipo de fallo. */
  protected get errorMessage(): string | null {
    if (!this.hasError || !this.ngControl?.errors) return null;
    const errors = this.ngControl.errors;
    if (errors['required']) return 'Este campo es obligatorio';
    if (errors['email']) return 'Introduce un email válido';
    if (errors['minlength']) {
      const req = errors['minlength'].requiredLength as number;
      return `Mínimo ${req} caracteres`;
    }
    if (errors['maxlength']) {
      const max = errors['maxlength'].requiredLength as number;
      return `Máximo ${max} caracteres`;
    }
    if (errors['pattern']) return 'Formato no válido';
    if (errors['passwordTooShort'])         return 'Mínimo 8 caracteres';
    if (errors['passwordMissingUppercase']) return 'Añade al menos una letra mayúscula';
    if (errors['passwordMissingLowercase']) return 'Añade al menos una letra minúscula';
    if (errors['passwordMissingSpecial'])   return 'Añade al menos un carácter especial (!, @, #…)';
    return 'Campo no válido';
  }

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
