// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';

// --------------------------------------------------------------------------
// SERVICIO: Gestión centralizada del título de la página
// --------------------------------------------------------------------------

/**
 * Servicio que gestiona el título del documento (pestaña del navegador)
 * con el formato «Scantral | Nombre de página».
 *
 * - `setRouteTitle()` se llama desde la estrategia de rutas y almacena
 *   el título de la ruta actual para poder restaurarlo cuando se cierra
 *   un modal.
 * - `setModalTitle()` se llama desde los servicios de modal para
 *   mostrar el nombre del modal mientras está abierto.
 * - `restoreRouteTitle()` revierte al título de la ruta guardada.
 */
@Injectable({ providedIn: 'root' })
export class PageTitleService {
  private readonly titleService = inject(Title);

  /** Último título de ruta almacenado. */
  private routeTitle = 'Scantral';

  // --------------------------------------------------------------------------
  // MÉTODOS PÚBLICOS
  // --------------------------------------------------------------------------

  /**
   * Establece el título de la ruta activa y lo almacena internamente
   * para poder restaurarlo al cerrar modales.
   */
  setRouteTitle(title: string): void {
    this.routeTitle = title ? `Scantral | ${title}` : 'Scantral';
    this.titleService.setTitle(this.routeTitle);
  }

  /**
   * Establece temporalmente el título del navegador con el nombre
   * del modal abierto, sin sobreescribir el título de ruta guardado.
   */
  setModalTitle(title: string): void {
    this.titleService.setTitle(`Scantral | ${title}`);
  }

  /**
   * Restaura el título del navegador al de la ruta activa guardada.
   * Debe llamarse al cerrar cualquier modal.
   */
  restoreRouteTitle(): void {
    this.titleService.setTitle(this.routeTitle);
  }
}
