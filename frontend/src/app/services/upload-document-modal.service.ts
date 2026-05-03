// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// SERVICIO: Upload document modal control
// --------------------------------------------------------------------------

/**
 * Servicio que controla la apertura del modal de subida de documentos.
 * Recuerda opcionalmente el `groupId` al que pertenecerá el documento
 * para precargarlo en el formulario.
 */
@Injectable({ providedIn: 'root' })
export class UploadDocumentModalService {
  private readonly _isOpen = signal(false);
  private readonly _groupId = signal<number | null>(null);

  /** Estado de visibilidad del modal. */
  readonly isOpen = this._isOpen.asReadonly();
  /** Id del grupo al que se asignará el documento (si procede). */
  readonly groupId = this._groupId.asReadonly();

  /** Abre el modal, opcionalmente vinculado a un grupo. */
  open(groupId?: number): void {
    this._groupId.set(groupId ?? null);
    this._isOpen.set(true);
  }

  /** Cierra el modal y limpia el grupo asociado. */
  close(): void {
    this._isOpen.set(false);
    this._groupId.set(null);
  }
}
