// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, HostListener, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button';

// --------------------------------------------------------------------------
// COMPONENTE: CONFIRM MODAL (Modal de confirmación reutilizable)
// --------------------------------------------------------------------------

/**
 * Modal de confirmación genérico (sí/no). Cierra al pulsar `Escape` o
 * al hacer clic en el backdrop. Emite `confirmed` o `cancelled` según
 * la acción del usuario.
 */
@Component({
  selector: 'app-confirm-modal',
  imports: [ButtonComponent],
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss',
})
export class ConfirmModalComponent {
  /** Título del modal. */
  title = input.required<string>();
  /** Mensaje principal del modal. */
  message = input.required<string>();
  /** Texto del botón de confirmar. */
  confirmLabel = input('Confirmar');
  /** Texto del botón de cancelar. */
  cancelLabel = input('Cancelar');

  /** Emitido al confirmar. */
  confirmed = output<void>();
  /** Emitido al cancelar. */
  cancelled = output<void>();

  /** Cierra el modal al pulsar `Escape`. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancelled.emit();
  }

  /** Cierra el modal al hacer clic fuera del card. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelled.emit();
    }
  }
}
