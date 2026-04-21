import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { type DocumentStatus } from '../../../models/document.model';

@Component({
  selector: 'app-document-status-card',
  imports: [FaIconComponent],
  templateUrl: './document-status-card.html',
  styleUrl: './document-status-card.scss',
})
export class DocumentStatusCardComponent {
  status = input.required<DocumentStatus>();
  statusLabel = input.required<string>();
  statusSubtitle = input.required<string>();
  issueDate = input.required<string>();
  expiryDate = input.required<string>();

  protected readonly faCircleExclamation = faCircleExclamation;
  protected readonly faCircleCheck = faCircleCheck;

  protected get isExpired(): boolean {
    return this.status() === 'EXPIRED';
  }
}
