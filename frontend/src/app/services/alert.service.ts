// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, signal } from '@angular/core';

// --------------------------------------------------------------------------
// TIPO: Alert
// --------------------------------------------------------------------------

/** Categorías visuales soportadas por las alertas (toasts). */
export type AlertType = 'success' | 'error' | 'warning' | 'info';

/** Alerta mostrada en la UI. */
export interface Alert {
  id: number;
  type: AlertType;
  message: string;
}

// --------------------------------------------------------------------------
// SERVICIO: Alert management
// --------------------------------------------------------------------------

/**
 * Servicio centralizado de notificaciones (toasts).
 *
 * Mantiene una lista reactiva de alertas que se renderiza en el componente
 * `<app-alerts>` situado en el raíz de la aplicación. Cada alerta se
 * descarta automáticamente tras la duración indicada gracias a `setTimeout`.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  /** Contador monotónico para generar identificadores únicos por alerta. */
  private _idCounter = 0;
  /** Lista reactiva de alertas activas. */
  private readonly _alerts = signal<Alert[]>([]);

  /** Alertas en sólo lectura para los consumidores. */
  readonly alerts = this._alerts.asReadonly();

  /**
   * Muestra una nueva alerta en la UI.
   *
   * @param type     Tipo visual (success / error / warning / info).
   * @param message  Texto a mostrar al usuario.
   * @param duration Tiempo en ms antes del autocierre (por defecto 4000).
   */
  show(type: AlertType, message: string, duration = 4000): void {
    const alert: Alert = { id: ++this._idCounter, type, message };
    this._alerts.update((a) => [...a, alert]);

    // Autocierre programado mediante el objeto global `setTimeout`.
    setTimeout(() => this.close(alert.id), duration);
  }

  /** Cierra manualmente la alerta con el id indicado. */
  close(id: number): void {
    this._alerts.update((a) => a.filter((al) => al.id !== id));
  }
}
