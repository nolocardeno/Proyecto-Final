// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal, computed } from '@angular/core';

// --------------------------------------------------------------------------
// TIPOS
// --------------------------------------------------------------------------

/** Estados posibles del consentimiento del usuario. */
export type ConsentStatus = 'accepted' | 'rejected' | 'pending';

// --------------------------------------------------------------------------
// SERVICIO: COOKIE CONSENT
// --------------------------------------------------------------------------

/**
 * Gestiona el consentimiento del usuario para almacenamientos no esenciales.
 *
 * Scantral solo utiliza almacenamiento estrictamente necesario (sesión,
 * tema y email recordado opcional). No carga scripts de terceros ni
 * analítica, por lo que el rol principal de este servicio es informar al
 * usuario y registrar su decisión de forma persistente en `localStorage`.
 */
@Injectable({ providedIn: 'root' })
export class CookieConsentService {
  /** Clave usada para persistir la decisión del usuario. */
  private readonly STORAGE_KEY = 'scantral_cookie_consent';

  /** Estado reactivo del consentimiento. */
  private readonly _status = signal<ConsentStatus>(this.load());

  /** Consentimiento en modo sólo lectura. */
  readonly status = this._status.asReadonly();
  /** `true` si el usuario aún no ha tomado una decisión. */
  readonly isPending = computed(() => this._status() === 'pending');
  /** `true` si el usuario ha aceptado los almacenamientos opcionales. */
  readonly isAccepted = computed(() => this._status() === 'accepted');

  /** Registra el consentimiento del usuario y lo persiste. */
  accept(): void {
    this.persist('accepted');
  }

  /** Registra el rechazo del usuario y lo persiste. */
  reject(): void {
    this.persist('rejected');
  }

  /** Restablece el consentimiento (uso interno y para tests). */
  reset(): void {
    this._status.set('pending');
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch {
      /* localStorage no disponible: estado solo en memoria. */
    }
  }

  /** Persiste el nuevo estado y actualiza el signal. */
  private persist(value: Exclude<ConsentStatus, 'pending'>): void {
    this._status.set(value);
    try {
      localStorage.setItem(this.STORAGE_KEY, value);
    } catch {
      /* SSR o almacenamiento bloqueado: el signal mantiene el estado. */
    }
  }

  /** Lee el valor previamente almacenado o devuelve `'pending'`. */
  private load(): ConsentStatus {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      return raw === 'accepted' || raw === 'rejected' ? raw : 'pending';
    } catch {
      return 'pending';
    }
  }
}
