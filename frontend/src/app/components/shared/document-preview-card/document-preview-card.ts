// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: DOCUMENT PREVIEW CARD
// --------------------------------------------------------------------------

/**
 * Tarjeta con la previsualización de la imagen de un documento.
 * Si no hay imagen muestra un placeholder y, al hacer clic, emite
 * `openLightbox` con la URL para que el padre abra la vista ampliada.
 */
@Component({
  selector: 'app-document-preview-card',
  imports: [FaIconComponent],
  templateUrl: './document-preview-card.html',
  styleUrl: './document-preview-card.scss',
})
export class DocumentPreviewCardComponent {
  /** Ruta de la imagen del documento (puede ser nula). */
  imagePath = input<string | null>(null);
  /** Texto alternativo accesible. */
  alt = input<string>('Vista previa del documento');

  /** Emite la URL al solicitar la vista ampliada. */
  openLightbox = output<string>();

  protected readonly faImage = faImage;
}
