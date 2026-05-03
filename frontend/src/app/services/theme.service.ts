// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

// --------------------------------------------------------------------------
// TIPOS
// --------------------------------------------------------------------------
export type Theme = 'light' | 'dark';

// --------------------------------------------------------------------------
// CONSTANTES
// --------------------------------------------------------------------------
const STORAGE_KEY = 'scantral.theme';
const THEME_ATTRIBUTE = 'data-theme';

// --------------------------------------------------------------------------
// SERVICIO: ThemeService
// --------------------------------------------------------------------------

/**
 * Servicio que gestiona el tema visual de la aplicación.
 *
 * Estrategia de resolución del tema inicial:
 *  1. Valor persistido en `localStorage` (preferencia explícita del usuario).
 *  2. Si no existe, se consulta `window.matchMedia('(prefers-color-scheme: dark)')`
 *     para respetar la configuración del sistema operativo.
 *  3. Por defecto, modo claro.
 *
 * El cambio de tema se aplica modificando el atributo `data-theme` del
 * elemento `<html>` mediante el objeto `document` predefinido del navegador.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  /** Tema actual reactivo. */
  private readonly _theme = signal<Theme>(this.resolveInitialTheme());

  /** Tema en sólo lectura para los consumidores. */
  readonly theme = this._theme.asReadonly();
  /** `true` si el tema activo es oscuro. */
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // `effect` mantiene sincronizados el atributo del DOM y `localStorage`
    // cada vez que cambia el signal `_theme`.
    effect(() => {
      const theme = this._theme();
      this.document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
      this.document.defaultView?.localStorage?.setItem(STORAGE_KEY, theme);
    });
  }

  /** Alterna entre tema claro y oscuro. */
  toggle(): void {
    this._theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  /** Establece explícitamente el tema indicado. */
  set(theme: Theme): void {
    this._theme.set(theme);
  }

  // ------------------------------------------------------------------------
  // Resolución inicial: storage > prefers-color-scheme > 'light'
  // ------------------------------------------------------------------------
  /** Calcula el tema inicial siguiendo la estrategia documentada en la clase. */
  private resolveInitialTheme(): Theme {
    const win = this.document.defaultView;
    const stored = win?.localStorage?.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    if (win?.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }
}
