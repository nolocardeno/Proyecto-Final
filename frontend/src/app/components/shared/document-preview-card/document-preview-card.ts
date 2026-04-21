import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-document-preview-card',
  templateUrl: './document-preview-card.html',
  styleUrl: './document-preview-card.scss',
})
export class DocumentPreviewCardComponent {
  imagePath = input<string | null>(null);
  alt = input<string>('Vista previa del documento');

  openLightbox = output<string>();
}
