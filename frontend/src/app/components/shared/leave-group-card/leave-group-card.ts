// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal';

// --------------------------------------------------------------------------
// COMPONENTE: LEAVE GROUP CARD (Card + modal de confirmación)
// --------------------------------------------------------------------------

/**
 * Tarjeta para abandonar un grupo. Abre un `ConfirmModal` antes de
 * emitir el evento `leaveConfirmed` al padre.
 */
@Component({
  selector: 'app-leave-group-card',
  imports: [FaIconComponent, ButtonComponent, ConfirmModalComponent],
  templateUrl: './leave-group-card.html',
  styleUrl: './leave-group-card.scss',
})
export class LeaveGroupCardComponent {
  protected readonly faRightFromBracket = faRightFromBracket;
  protected showConfirm = false;

  /** Emitido cuando el usuario confirma que quiere abandonar el grupo. */
  leaveConfirmed = output<void>();

  /** Muestra el modal de confirmación. */
  protected openConfirm(): void {
    this.showConfirm = true;
  }

  /** Cierra el modal y emite `leaveConfirmed`. */
  protected onConfirm(): void {
    this.showConfirm = false;
    this.leaveConfirmed.emit();
  }

  /** Cierra el modal sin abandonar. */
  protected onCancel(): void {
    this.showConfirm = false;
  }
}
