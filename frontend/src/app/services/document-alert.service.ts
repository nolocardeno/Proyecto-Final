// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

// --------------------------------------------------------------------------
// TIPOS
// --------------------------------------------------------------------------

/** Alerta de caducidad asociada a un documento. */
export interface DocumentAlertResponse {
  id: number;
  documentId: number;
  daysBeforeExpiry: number;
  notifiedAt: string | null;
  createdAt: string;
}

// --------------------------------------------------------------------------
// SERVICIO: DOCUMENT ALERT
// --------------------------------------------------------------------------

/**
 * Servicio CRUD de alertas de caducidad sobre un documento. Permite
 * consultar, crear y eliminar alertas que disparán notificaciones
 * antes de que el documento expire.
 */
@Injectable({ providedIn: 'root' })
export class DocumentAlertService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  /** Cabeceras con el id del usuario autenticado. */
  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  /** Construye la URL base del recurso de alertas para un documento. */
  private baseUrl(documentId: number): string {
    return `/api/documents/${documentId}/alerts`;
  }

  /** Devuelve las alertas configuradas para el documento indicado. */
  getAlerts(documentId: number): Observable<DocumentAlertResponse[]> {
    return this.http.get<DocumentAlertResponse[]>(this.baseUrl(documentId), { headers: this.headers });
  }

  /** Crea una nueva alerta a `daysBeforeExpiry` días antes de la caducidad. */
  createAlert(documentId: number, daysBeforeExpiry: number): Observable<DocumentAlertResponse> {
    return this.http.post<DocumentAlertResponse>(
      this.baseUrl(documentId),
      { daysBeforeExpiry },
      { headers: this.headers }
    );
  }

  /** Elimina la alerta indicada. */
  deleteAlert(documentId: number, alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(documentId)}/${alertId}`, { headers: this.headers });
  }
}
