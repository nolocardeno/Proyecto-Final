// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faTicket,
  faFileLines,
  faBuilding,
  faCalendarCheck,
  faCalendarXmark,
  faCircleExclamation,
  faCircleCheck,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { type DocumentStatus } from '../../../models/document.model';

// --------------------------------------------------------------------------
// TIPO: Document variants
// --------------------------------------------------------------------------
export type DocumentVariant = 'ticket' | 'document';

// --------------------------------------------------------------------------
// CONFIGURATION MAPS
// --------------------------------------------------------------------------
const ICONS: Record<DocumentVariant, IconDefinition> = {
  ticket: faTicket,
  document: faFileLines,
};

// --------------------------------------------------------------------------
// COMPONENTE: DOCUMENT CARD
// --------------------------------------------------------------------------

/**
 * Tarjeta resumen de un documento usada en los listados. Recibe los
 * campos via `input()` y calcula el icono y el estado de caducidad con
 * `computed()`. Si se proporciona `documentId`, hace de enlace de
 * navegación al detalle a través de `RouterLink`.
 */
@Component({
  selector: 'app-document-card',
  imports: [FaIconComponent, RouterLink],
  templateUrl: './document-card.html',
  styleUrl: './document-card.scss',
})
export class DocumentCardComponent {
  /** Variante visual del documento. */
  type = input<DocumentVariant>('ticket');
  /** Título principal mostrado en la tarjeta. */
  title = input.required<string>();
  /** Categoría corta (DNI, Pasaporte, etc.). */
  category = input.required<string>();
  /** Comercio o entidad emisora. */
  entity = input.required<string>();
  /** Fecha de emisión formateada. */
  issueDate = input.required<string>();
  /** Fecha de expiración formateada. */
  expiryDate = input.required<string>();
  /** Texto del estado (etiqueta visible). */
  statusText = input.required<string>();
  /** Estado lógico (afecta al estilo y al icono). */
  status = input.required<DocumentStatus>();
  /** Id del documento (habilita la navegación). */
  documentId = input<number>();
  /** Id del grupo si la tarjeta se renderiza dentro de un grupo. */
  groupId = input<number>();

  // --- Iconos Font Awesome ---
  protected readonly faBuilding = faBuilding;
  protected readonly faCalendarCheck = faCalendarCheck;
  protected readonly faCalendarXmark = faCalendarXmark;
  protected readonly faCircleExclamation = faCircleExclamation;
  protected readonly faCircleCheck = faCircleCheck;

  // --- Computed ---
  protected readonly typeIcon = computed(() => ICONS[this.type()]);
  protected readonly isExpired = computed(() => this.status() === 'EXPIRED');
}
