// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// SERVICIO: Upload document modal control
// --------------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class UploadDocumentModalService {
  private readonly _isOpen = signal(false);
  private readonly _groupId = signal<number | null>(null);

  readonly isOpen = this._isOpen.asReadonly();
  readonly groupId = this._groupId.asReadonly();

  open(groupId?: number): void {
    this._groupId.set(groupId ?? null);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
    this._groupId.set(null);
  }
}
