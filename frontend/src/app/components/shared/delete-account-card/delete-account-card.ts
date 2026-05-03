// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, output } from '@angular/core';
import { ButtonComponent } from '../../shared/button/button';
import { ConfirmModalComponent } from '../../shared/confirm-modal/confirm-modal';

// --------------------------------------------------------------------------
// COMPONENTE: DELETE ACCOUNT CARD (Card + modal de confirmación)
// --------------------------------------------------------------------------

/**
 * Tarjeta para eliminar la cuenta del usuario. Muestra un
 * `ConfirmModal` antes de propagar el evento `deleteConfirmed` al
 * padre, evitando bajas accidentales.
 */
@Component({
  selector: 'app-delete-account-card',
  imports: [ButtonComponent, ConfirmModalComponent],
  templateUrl: './delete-account-card.html',
  styleUrl: './delete-account-card.scss',
})
export class DeleteAccountCardComponent {
  protected showConfirm = false;

  /** Emitido cuando el usuario confirma la eliminación de su cuenta. */
  deleteConfirmed = output<void>();

  /** Muestra el modal de confirmación. */
  protected openConfirm(): void {
    this.showConfirm = true;
  }

  /** Cierra el modal y propaga la confirmación. */
  protected onConfirm(): void {
    this.showConfirm = false;
    this.deleteConfirmed.emit();
  }

  /** Cierra el modal cancelando la operación. */
  protected onCancel(): void {
    this.showConfirm = false;
  }
}
