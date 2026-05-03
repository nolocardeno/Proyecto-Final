// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendarDays, faDownload } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { ExportButtonComponent } from '../export-button/export-button';

// --------------------------------------------------------------------------
// COMPONENTE: EXPORT SECTION
// --------------------------------------------------------------------------

/**
 * Sección con las opciones de exportación del documento a calendarios
 * (Google Calendar, Outlook) y descarga ICS. Sólo se muestra si el
 * documento dispone de fecha de expiración.
 */
@Component({
  selector: 'app-export-section',
  imports: [FaIconComponent, ExportButtonComponent],
  templateUrl: './export-section.html',
  styleUrl: './export-section.scss',
})
export class ExportSectionComponent {
  /** Indica si el documento tiene fecha de caducidad. */
  hasExpiryDate = input.required<boolean>();

  /** Emitido al pulsar el botón de Google Calendar. */
  openGoogle = output<void>();
  /** Emitido al pulsar el botón de Outlook. */
  openOutlook = output<void>();
  /** Emitido al pulsar el botón de descarga ICS. */
  downloadIcs = output<void>();

  protected readonly faCalendarDays = faCalendarDays;
  protected readonly faDownload = faDownload;
  protected readonly faGoogle = faGoogle;
}
