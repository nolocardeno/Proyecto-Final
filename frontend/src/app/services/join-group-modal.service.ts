// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject, signal } from '@angular/core';
import { PageTitleService } from './page-title.service';

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
  private readonly pageTitle = inject(PageTitleService);

  /** Estado de visibilidad del modal en sólo lectura. */
  readonly isOpen = this._isOpen.asReadonly();

  /** Abre el modal. */
  open(): void {
    this._isOpen.set(true);
    this.pageTitle.setModalTitle('Unirse a grupo');
  }

  /** Cierra el modal. */
  close(): void {
    this._isOpen.set(false);
    this.pageTitle.restoreRouteTitle();
  }
}
