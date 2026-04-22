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
export type DocumentHistoryType = 'CREATED' | 'UPDATED' | 'IMAGE_UPLOADED' | 'RENEWED' | 'DATES_UPDATED';

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
@Injectable({ providedIn: 'root' })
export class DocumentHistoryService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/documents';

  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  getHistory(documentId: number): Observable<DocumentHistoryEntry[]> {
    return this.http.get<DocumentHistoryEntry[]>(
      `${this.baseUrl}/${documentId}/history`,
      { headers: this.headers },
    );
  }
}
