// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { AlertService } from '../../../services/alert.service';

// --------------------------------------------------------------------------
// COMPONENTE: COPY BUTTON (Botón reutilizable para copiar texto)
// --------------------------------------------------------------------------

/**
 * Botón que copia un texto al portapapeles del sistema usando la API
 * predefinida del navegador `navigator.clipboard`. Muestra una alerta
 * de confirmación a través del `AlertService` cuando la operación
 * se completa correctamente.
 */
@Component({
  selector: 'app-copy-button',
  imports: [FaIconComponent],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.scss',
})
export class CopyButtonComponent {
  private readonly alert = inject(AlertService);

  /** Texto que se copiará al portapapeles. */
  textToCopy = input.required<string>();
  /** Etiqueta accesible para lectores de pantalla. */
  ariaLabel = input<string>('Copiar al portapapeles');
  /** Mensaje mostrado al usuario tras una copia exitosa. */
  successMessage = input<string>('Copiado al portapapeles');

  protected readonly faCopy = faCopy;

  /** Manejador del evento `click`: usa `navigator.clipboard` para copiar. */
  protected copy(): void {
    navigator.clipboard.writeText(this.textToCopy()).then(() => {
      this.alert.show('success', this.successMessage());
    });
  }
}
