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
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// TIPO: Document variants
// --------------------------------------------------------------------------
export type DocumentVariant = 'ticket' | 'document';

// --------------------------------------------------------------------------
// CONFIGURATION MAPS
// --------------------------------------------------------------------------
const LABELS: Record<DocumentVariant, string> = {
  ticket: 'TICKET',
  document: 'DOCUMENTO',
};

const ICONS: Record<DocumentVariant, IconDefinition> = {
  ticket: faTicket,
  document: faFileLines,
};

// --------------------------------------------------------------------------
// COMPONENTE: DOCUMENT CARD
// --------------------------------------------------------------------------
@Component({
  selector: 'app-document-card',
  imports: [FaIconComponent, RouterLink],
  templateUrl: './document-card.html',
  styleUrl: './document-card.scss',
})
export class DocumentCardComponent {
  type = input<DocumentVariant>('ticket');
  title = input.required<string>();
  category = input.required<string>();
  entity = input.required<string>();
  issueDate = input.required<string>();
  expiryDate = input.required<string>();
  statusText = input.required<string>();
  documentId = input<number>();
  groupId = input<number>();

  // --- Iconos Font Awesome ---
  protected readonly faBuilding = faBuilding;
  protected readonly faCalendarCheck = faCalendarCheck;
  protected readonly faCalendarXmark = faCalendarXmark;

  // --- Computed ---
  protected readonly typeLabel = computed(() => LABELS[this.type()]);
  protected readonly typeIcon = computed(() => ICONS[this.type()]);
}
