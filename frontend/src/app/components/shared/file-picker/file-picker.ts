// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, input, output, signal } from '@angular/core';
import { AlertService } from '../../../services/alert.service';

// --------------------------------------------------------------------------
// CONSTANTES
// --------------------------------------------------------------------------

/**
 * Expresión regular que valida la extensión aceptada del archivo.
 * Demuestra el uso del objeto predefinido `RegExp` para validaciones
 * complejas en cliente.
 */
const IMAGE_EXTENSION_REGEX = /\.(jpe?g|png|webp|heic|heif)$/i;

/** Tamaño máximo permitido en bytes (10 MB). */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

// --------------------------------------------------------------------------
// COMPONENTE: FILE PICKER (Selector de archivos reutilizable)
// --------------------------------------------------------------------------

/**
 * Selector de archivos reutilizable.
 *
 * Captura el evento `change` del `<input type="file">`, valida el
 * archivo seleccionado mediante el objeto predefinido `RegExp`
 * (extensión) y comprueba el tamaño contra `MAX_FILE_SIZE_BYTES`
 * antes de emitirlo al componente padre.
 */
@Component({
  selector: 'app-file-picker',
  templateUrl: './file-picker.html',
  styleUrl: './file-picker.scss',
})
export class FilePickerComponent {
  private readonly alertService = inject(AlertService);

  /** Tipos MIME aceptados por el `<input>` (atributo `accept`). */
  accept = input<string>('image/*');
  /** Tamaño máximo permitido en bytes. */
  maxSizeBytes = input<number>(MAX_FILE_SIZE_BYTES);

  /** Emite el archivo seleccionado tras validarlo. */
  fileSelected = output<File>();

  /** Nombre del archivo seleccionado (mostrado en la UI). */
  protected readonly fileName = signal('');

  /**
   * Manejador del evento `change` del input file.
   *
   * 1. Obtiene el primer archivo de `input.files`.
   * 2. Valida tipo (RegExp) y tamaño (`File.size`).
   * 3. Emite el archivo al componente padre.
   */
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!IMAGE_EXTENSION_REGEX.test(file.name)) {
      this.alertService.show('error', 'Formato no soportado. Usa JPG, PNG, WEBP o HEIC.');
      input.value = '';
      return;
    }

    if (file.size > this.maxSizeBytes()) {
      const limitMb = Math.round(this.maxSizeBytes() / (1024 * 1024));
      this.alertService.show('error', `El archivo supera el tamaño máximo de ${limitMb} MB.`);
      input.value = '';
      return;
    }

    this.fileName.set(file.name);
    this.fileSelected.emit(file);
  }
}
