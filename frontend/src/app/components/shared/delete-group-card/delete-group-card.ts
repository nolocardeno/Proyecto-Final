// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

// --------------------------------------------------------------------------
// COMPONENTE: DELETE GROUP CARD (Card + modal de confirmación)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-delete-group-card',
  imports: [FaIconComponent, ButtonComponent, ConfirmModalComponent],
  templateUrl: './delete-group-card.html',
  styleUrl: './delete-group-card.scss',
})
export class DeleteGroupCardComponent {
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
