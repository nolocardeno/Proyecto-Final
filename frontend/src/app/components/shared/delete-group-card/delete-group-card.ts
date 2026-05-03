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

/**
 * Tarjeta para eliminar un grupo. Abre un `ConfirmModal` antes de
 * emitir el evento `deleteConfirmed` al padre.
 */
@Component({
  selector: 'app-delete-group-card',
  imports: [FaIconComponent, ButtonComponent, ConfirmModalComponent],
  templateUrl: './delete-group-card.html',
  styleUrl: './delete-group-card.scss',
})
export class DeleteGroupCardComponent {
  protected readonly faTrashCan = faTrashCan;
  protected showConfirm = false;

  /** Emitido cuando el usuario confirma la eliminación del grupo. */
  deleteConfirmed = output<void>();

  /** Muestra el modal de confirmación. */
  protected openConfirm(): void {
    this.showConfirm = true;
  }

  /** Cierra el modal y emite `deleteConfirmed`. */
  protected onConfirm(): void {
    this.showConfirm = false;
    this.deleteConfirmed.emit();
  }

  /** Cierra el modal sin eliminar. */
  protected onCancel(): void {
    this.showConfirm = false;
  }
}
