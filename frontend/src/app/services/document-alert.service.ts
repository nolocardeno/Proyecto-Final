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
@Injectable({ providedIn: 'root' })
export class DocumentAlertService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  private baseUrl(documentId: number): string {
    return `/api/documents/${documentId}/alerts`;
  }

  getAlerts(documentId: number): Observable<DocumentAlertResponse[]> {
    return this.http.get<DocumentAlertResponse[]>(this.baseUrl(documentId), { headers: this.headers });
  }

  createAlert(documentId: number, daysBeforeExpiry: number): Observable<DocumentAlertResponse> {
    return this.http.post<DocumentAlertResponse>(
      this.baseUrl(documentId),
      { daysBeforeExpiry },
      { headers: this.headers }
    );
  }

  deleteAlert(documentId: number, alertId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl(documentId)}/${alertId}`, { headers: this.headers });
  }
}
