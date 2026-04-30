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
@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly _isOpen = signal<boolean>(false);

  readonly isOpen = this._isOpen.asReadonly();

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggle(): void {
    this._isOpen.update((v) => !v);
  }
}
