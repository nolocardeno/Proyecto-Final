import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';

/** Par etiqueta-valor renderizado en la tarjeta. */
export interface InfoField {
  label: string;
  value: string;
}

// --------------------------------------------------------------------------
// COMPONENTE: DOCUMENT INFO CARD
// --------------------------------------------------------------------------

/**
 * Tarjeta genérica de información. Recibe una lista de campos
 * (`fields`) y los renderiza como pares etiqueta/valor.
 */
@Component({
  selector: 'app-document-info-card',
  imports: [FaIconComponent],
  templateUrl: './document-info-card.html',
  styleUrl: './document-info-card.scss',
})
export class DocumentInfoCardComponent {
  /** Lista de campos a mostrar. */
  fields = input.required<InfoField[]>();

  protected readonly faFileLines = faFileLines;
}
