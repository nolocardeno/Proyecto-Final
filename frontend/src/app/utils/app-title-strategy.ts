// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { PageTitleService } from '../services/page-title.service';

// --------------------------------------------------------------------------
// ESTRATEGIA DE TÍTULO: Scantral | Nombre de ruta
// --------------------------------------------------------------------------

/**
 * Estrategia personalizada de títulos para el router de Angular.
 * Formatea el título de cada ruta como «Scantral | {title}» y delega
 * en `PageTitleService` para que los modales puedan restaurarlo.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private readonly pageTitle = inject(PageTitleService);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const title = this.buildTitle(snapshot);
    this.pageTitle.setRouteTitle(title ?? '');
  }
}
