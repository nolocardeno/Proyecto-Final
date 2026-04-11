// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// SERVICIO: Group modal control
// --------------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class GroupModalService {
  private readonly _isOpen = signal(false);

  readonly isOpen = this._isOpen.asReadonly();

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }
}
