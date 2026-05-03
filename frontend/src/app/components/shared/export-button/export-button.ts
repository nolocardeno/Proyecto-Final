// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: EXPORT BUTTON
// --------------------------------------------------------------------------

/**
 * Tarjeta-botón usada en la sección de exportación a calendarios.
 * Muestra un icono identificativo y un pequeño texto, y emite el evento
 * `action` cuando el usuario hace clic.
 */
@Component({
  selector: 'app-export-button',
  imports: [FaIconComponent],
  templateUrl: './export-button.html',
  styleUrl: './export-button.scss',
})
export class ExportButtonComponent {
  /** Icono FontAwesome a mostrar (Google, Outlook, ICS, etc.). */
  icon = input.required<IconDefinition>();
  /** Nombre del servicio de exportación. */
  name = input.required<string>();
  /** Descripción breve mostrada bajo el nombre. */
  description = input.required<string>();
  /** Texto accesible (aria-label) del botón. */
  ariaLabel = input.required<string>();

  /** Emitido cuando el usuario hace clic en la tarjeta. */
  action = output<void>();

  protected readonly faCalendarPlus = faCalendarPlus;
}
