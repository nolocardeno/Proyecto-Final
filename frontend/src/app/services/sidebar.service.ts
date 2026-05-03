// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// SERVICIO: Sidebar drawer (mobile/tablet)
// --------------------------------------------------------------------------
// En desktop (lg+) el sidebar es siempre visible y este estado se ignora.
// En <lg el sidebar actúa como drawer off-canvas controlado por este flag.
// --------------------------------------------------------------------------

/**
 * Servicio de control del drawer del sidebar en móvil/tablet. En
 * desktop el sidebar es siempre visible y este estado se ignora.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  /** Estado interno del drawer. */
  private readonly _isOpen = signal<boolean>(false);

  /** Estado de sólo lectura del drawer. */
  readonly isOpen = this._isOpen.asReadonly();

  /** Abre el drawer. */
  open(): void {
    this._isOpen.set(true);
  }

  /** Cierra el drawer. */
  close(): void {
    this._isOpen.set(false);
  }

  /** Alterna el estado abierto/cerrado del drawer. */
  toggle(): void {
    this._isOpen.update((v) => !v);
  }
}
