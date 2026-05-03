// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// SERVICIO: Group modal control
// --------------------------------------------------------------------------

/**
 * Servicio que controla la apertura del modal de creación de grupos.
 */
@Injectable({ providedIn: 'root' })
export class GroupModalService {
  private readonly _isOpen = signal(false);

  /** Estado de visibilidad del modal en sólo lectura. */
  readonly isOpen = this._isOpen.asReadonly();

  /** Abre el modal de creación de grupo. */
  open(): void {
    this._isOpen.set(true);
  }

  /** Cierra el modal. */
  close(): void {
    this._isOpen.set(false);
  }
}
