import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';

export interface InfoField {
  label: string;
  value: string;
}

@Component({
  selector: 'app-document-info-card',
  imports: [FaIconComponent],
  templateUrl: './document-info-card.html',
  styleUrl: './document-info-card.scss',
})
export class DocumentInfoCardComponent {
  fields = input.required<InfoField[]>();

  protected readonly faFileLines = faFileLines;
}
