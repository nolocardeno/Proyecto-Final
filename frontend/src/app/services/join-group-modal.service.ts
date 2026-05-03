// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// SERVICIO: Join group modal control
// --------------------------------------------------------------------------

/**
 * Servicio que controla la apertura del modal de unirse a un grupo
 * mediante código de acceso.
 */
@Injectable({ providedIn: 'root' })
export class JoinGroupModalService {
  private readonly _isOpen = signal(false);

  /** Estado de visibilidad del modal en sólo lectura. */
  readonly isOpen = this._isOpen.asReadonly();

  /** Abre el modal. */
  open(): void {
    this._isOpen.set(true);
  }

  /** Cierra el modal. */
  close(): void {
    this._isOpen.set(false);
  }
}
