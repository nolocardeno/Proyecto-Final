// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, HostListener, inject, input, output } from '@angular/core';
import { AuthModalService } from '../../../services/auth-modal.service';

// --------------------------------------------------------------------------
// COMPONENTE: AUTH CARD (Modal con backdrop para autenticación)
// --------------------------------------------------------------------------

/**
 * Tarjeta modal usada por las pantallas de login/registro. Incluye
 * backdrop con cierre al hacer clic fuera y soporte para tecla
 * `Escape` mediante `@HostListener`.
 */
@Component({
  selector: 'app-auth-card',
  templateUrl: './auth-card.html',
  styleUrl: './auth-card.scss',
})
export class AuthCardComponent {
  private readonly authModal = inject(AuthModalService);

  /** Título del modal. */
  title = input.required<string>();
  /** Emitido al cerrar el modal. */
  closed = output<void>();

  /** Cierra el modal al pulsar `Escape`. */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.close();
  }

  /** Cierra el modal al hacer clic fuera del card. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  /** Cierra el modal y notifica al servicio y al padre. */
  private close(): void {
    this.authModal.close();
    this.closed.emit();
  }
}
