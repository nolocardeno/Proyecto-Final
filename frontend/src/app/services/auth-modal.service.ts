// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// TIPO: Auth modal state
// --------------------------------------------------------------------------

/** Modal de autenticación actualmente visible (o `null` si ninguno). */
export type AuthModalType = 'login' | 'register' | null;

// --------------------------------------------------------------------------
// SERVICIO: Auth modal control
// --------------------------------------------------------------------------

/**
 * Servicio centralizado que controla qué modal de autenticación
 * (login o registro) está visible en la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private readonly _activeModal = signal<AuthModalType>(null);

  /** Modal activo en sólo lectura. */
  readonly activeModal = this._activeModal.asReadonly();

  /** Abre el modal de inicio de sesión. */
  openLogin(): void {
    this._activeModal.set('login');
  }

  /** Abre el modal de registro. */
  openRegister(): void {
    this._activeModal.set('register');
  }

  /** Cierra cualquier modal de autenticación abierto. */
  close(): void {
    this._activeModal.set(null);
  }
}
