// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject, signal } from '@angular/core';
import { PageTitleService } from './page-title.service';

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
  private readonly pageTitle = inject(PageTitleService);

  /** Estado de visibilidad del modal. */
  readonly isOpen = this._isOpen.asReadonly();
  /** Id del grupo al que se asignará el documento (si procede). */
  readonly groupId = this._groupId.asReadonly();

  /** Abre el modal, opcionalmente vinculado a un grupo. */
  open(groupId?: number): void {
    this._groupId.set(groupId ?? null);
    this._isOpen.set(true);
    this.pageTitle.setModalTitle('Subir documento');
  }

  /** Cierra el modal y limpia el grupo asociado. */
  close(): void {
    this._isOpen.set(false);
    this._groupId.set(null);
    this.pageTitle.restoreRouteTitle();
  }
}
