// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject, signal } from '@angular/core';
import { PageTitleService } from './page-title.service';

// --------------------------------------------------------------------------
// SERVICIO: Group modal control
// --------------------------------------------------------------------------

/**
 * Servicio que controla la apertura del modal de creación de grupos.
 */
@Injectable({ providedIn: 'root' })
export class GroupModalService {
  private readonly _isOpen = signal(false);
  private readonly pageTitle = inject(PageTitleService);

  /** Estado de visibilidad del modal en sólo lectura. */
  readonly isOpen = this._isOpen.asReadonly();

  /** Abre el modal de creación de grupo. */
  open(): void {
    this._isOpen.set(true);
    this.pageTitle.setModalTitle('Crear grupo');
  }

  /** Cierra el modal. */
  close(): void {
    this._isOpen.set(false);
    this.pageTitle.restoreRouteTitle();
  }
}
