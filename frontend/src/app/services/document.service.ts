// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentResponse } from '../models/document.model';
import { AuthService } from './auth.service';

// --------------------------------------------------------------------------
// SERVICIO: DOCUMENT
// --------------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/documents';

  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  getDocuments(): Observable<DocumentResponse[]> {
    return this.http.get<DocumentResponse[]>(this.baseUrl, { headers: this.headers });
  }

  getDocument(id: number): Observable<DocumentResponse> {
    return this.http.get<DocumentResponse>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  createDocument(body: Record<string, unknown>, groupId?: number, imageFile?: File | null): Observable<DocumentResponse> {
    const url = groupId ? `/api/groups/${groupId}/documents` : this.baseUrl;
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('file', imageFile);
    }
    return this.http.post<DocumentResponse>(url, formData, { headers: this.headers });
  }

  extractFromImage(file: File, groupId?: number): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const url = groupId
      ? `/api/groups/${groupId}/documents/extract`
      : `${this.baseUrl}/extract`;
    return this.http.post<DocumentResponse>(url, formData, { headers: this.headers });
  }

  uploadImage(documentId: number, file: File): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentResponse>(`${this.baseUrl}/${documentId}/image`, formData, { headers: this.headers });
  }

  updateDocument(id: number, body: Partial<Record<string, unknown>>, imageFile?: File | null): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('file', imageFile);
    }
    return this.http.put<DocumentResponse>(`${this.baseUrl}/${id}`, formData, { headers: this.headers });
  }

  deleteDocument(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }
}
