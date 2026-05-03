import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { type DocumentStatus } from '../../../models/document.model';

// --------------------------------------------------------------------------
// COMPONENTE: DOCUMENT STATUS CARD
// --------------------------------------------------------------------------

/**
 * Tarjeta con el estado de un documento (válido, expirado, etc.) y
 * sus fechas relevantes. Muestra un icono distinto según el `status`.
 */
@Component({
  selector: 'app-document-status-card',
  imports: [FaIconComponent],
  templateUrl: './document-status-card.html',
  styleUrl: './document-status-card.scss',
})
export class DocumentStatusCardComponent {
  /** Estado lógico del documento. */
  status = input.required<DocumentStatus>();
  /** Etiqueta breve del estado. */
  statusLabel = input.required<string>();
  /** Texto secundario del estado. */
  statusSubtitle = input.required<string>();
  /** Fecha de emisión formateada. */
  issueDate = input.required<string>();
  /** Fecha de expiración formateada. */
  expiryDate = input.required<string>();

  protected readonly faCircleExclamation = faCircleExclamation;
  protected readonly faCircleCheck = faCircleCheck;

  /** Indica si el documento está caducado. */
  protected get isExpired(): boolean {
    return this.status() === 'EXPIRED';
  }
}
