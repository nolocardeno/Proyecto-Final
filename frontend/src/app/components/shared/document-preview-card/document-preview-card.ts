import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faImage } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-document-preview-card',
  imports: [FaIconComponent],
  templateUrl: './document-preview-card.html',
  styleUrl: './document-preview-card.scss',
})
export class DocumentPreviewCardComponent {
  imagePath = input<string | null>(null);
  alt = input<string>('Vista previa del documento');

  openLightbox = output<string>();

  protected readonly faImage = faImage;
}
