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

/** Tipo de cambio registrado en el historial de un documento. */
export type DocumentHistoryType = 'CREATED' | 'UPDATED' | 'IMAGE_UPLOADED' | 'RENEWED' | 'DATES_UPDATED';

/** Entrada del historial de cambios de un documento. */
export interface DocumentHistoryEntry {
  id: number;
  documentId: number;
  changeType: DocumentHistoryType;
  description: string;
  changedByName: string;
  changedAt: string;
}

// --------------------------------------------------------------------------
// SERVICIO: DOCUMENT HISTORY
// --------------------------------------------------------------------------

/**
 * Servicio que recupera del backend el historial de cambios de un
 * documento (creación, actualizaciones, renovaciones, etc.).
 */
@Injectable({ providedIn: 'root' })
export class DocumentHistoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/documents';

  /** Cabeceras con el id del usuario autenticado. */
  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  /** Devuelve el historial de cambios del documento indicado. */
  getHistory(documentId: number): Observable<DocumentHistoryEntry[]> {
    return this.http.get<DocumentHistoryEntry[]>(
      `${this.baseUrl}/${documentId}/history`,
      { headers: this.headers },
    );
  }
}
