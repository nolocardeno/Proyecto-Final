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

/**
 * Tarjeta para eliminar un documento. Abre un `ConfirmModal` antes
 * de emitir el evento `deleteConfirmed` al padre, evitando borrados
 * accidentales.
 */
@Component({
  selector: 'app-delete-document-card',
  imports: [FaIconComponent, ButtonComponent, ConfirmModalComponent],
  templateUrl: './delete-document-card.html',
  styleUrl: './delete-document-card.scss',
})
export class DeleteDocumentCardComponent {
  protected readonly faTrashCan = faTrashCan;
  protected showConfirm = false;

  /** Emitido cuando el usuario confirma la eliminación. */
  deleteConfirmed = output<void>();

  /** Muestra el modal de confirmación. */
  protected openConfirm(): void {
    this.showConfirm = true;
  }

  /** Cierra el modal y emite el evento `deleteConfirmed`. */
  protected onConfirm(): void {
    this.showConfirm = false;
    this.deleteConfirmed.emit();
  }

  /** Cierra el modal sin eliminar. */
  protected onCancel(): void {
    this.showConfirm = false;
  }
}
