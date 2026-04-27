// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

// --------------------------------------------------------------------------
// COMPONENTE: DELETE DOCUMENT CARD (Card + modal de confirmación)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-delete-document-card',
  imports: [FaIconComponent, ButtonComponent, ConfirmModalComponent],
  templateUrl: './delete-document-card.html',
  styleUrl: './delete-document-card.scss',
})
export class DeleteDocumentCardComponent {
  protected readonly faTrashCan = faTrashCan;
  protected showConfirm = false;

  deleteConfirmed = output<void>();

  protected openConfirm(): void {
    this.showConfirm = true;
  }

  protected onConfirm(): void {
    this.showConfirm = false;
    this.deleteConfirmed.emit();
  }

  protected onCancel(): void {
    this.showConfirm = false;
  }
}
