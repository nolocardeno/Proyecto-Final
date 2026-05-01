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
// Gestiona el tema visual (light / dark) aplicando `data-theme` al <html>.
// Persiste la preferencia del usuario en localStorage; si no existe,
// respeta `prefers-color-scheme` del sistema.
// --------------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  private readonly _theme = signal<Theme>(this.resolveInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    // Sincroniza atributo del documento y persistencia con el signal.
    effect(() => {
      const theme = this._theme();
      this.document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
      this.document.defaultView?.localStorage?.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this._theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  set(theme: Theme): void {
    this._theme.set(theme);
  }

  // ------------------------------------------------------------------------
  // Resolución inicial: storage > prefers-color-scheme > 'light'
  // ------------------------------------------------------------------------
  private resolveInitialTheme(): Theme {
    const win = this.document.defaultView;
    const stored = win?.localStorage?.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    if (win?.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    return 'light';
  }
}
