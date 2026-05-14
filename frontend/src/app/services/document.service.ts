// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DocumentExtractionPreview, DocumentResponse } from '../models/document.model';
import { AuthService } from './auth.service';

// --------------------------------------------------------------------------
// SERVICIO: DOCUMENT
// --------------------------------------------------------------------------

/**
 * Servicio CRUD de documentos.
 *
 * Combina dos formatos de comunicación asíncrona con el servidor:
 *  - JSON puro para lecturas y borrados.
 *  - `multipart/form-data` (mediante `FormData` + `Blob`) para crear/editar
 *    documentos que pueden incluir imagen adjunta.
 *
 * Todas las peticiones van autenticadas vía el interceptor JWT
 * del usuario actual del `AuthService`.
 */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/documents';

  /** Cabeceras HTTP con el id del usuario autenticado (0 si no hay sesión). */
  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders();
  }

  /** Recupera todos los documentos del usuario. */
  getDocuments(): Observable<DocumentResponse[]> {
    return this.http
      .get<DocumentResponse[]>(this.baseUrl, { headers: this.headers })
      .pipe(catchError((err) => this.handleError(err, 'No se pudieron cargar los documentos')));
  }

  /** Recupera un documento por su id. */
  getDocument(id: number): Observable<DocumentResponse> {
    return this.http
      .get<DocumentResponse>(`${this.baseUrl}/${id}`, { headers: this.headers })
      .pipe(catchError((err) => this.handleError(err, 'No se pudo cargar el documento')));
  }

  /**
   * Crea un documento. Envía los datos como `multipart/form-data` con dos
   * partes: un `Blob` JSON con los campos y, opcionalmente, el archivo de
   * imagen. Si se indica `groupId` el documento se crea dentro de un grupo.
   */
  createDocument(body: Record<string, unknown>, groupId?: number, imageFile?: File | null): Observable<DocumentResponse> {
    const url = groupId ? `/api/groups/${groupId}/documents` : this.baseUrl;
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('file', imageFile);
    }
    return this.http.post<DocumentResponse>(url, formData, { headers: this.headers });
  }

  /**
   * Sube una imagen al servicio de OCR/IA y obtiene un documento ya
   * rellenado automáticamente con los datos extraídos.
   */
  extractFromImage(file: File, useAi: boolean, groupId?: number): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('useAi', String(useAi));
    const url = groupId
      ? `/api/groups/${groupId}/documents/extract`
      : `${this.baseUrl}/extract`;
    return this.http.post<DocumentResponse>(url, formData, { headers: this.headers });
  }

  /**
   * Sube una imagen al servicio de OCR/IA y obtiene únicamente los datos
   * detectados (sin crear el documento). El frontend usa esta respuesta
   * para prerellenar el formulario manual y que el usuario confirme.
   */
  previewFromImage(file: File, useAi: boolean, groupId?: number): Observable<DocumentExtractionPreview> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('useAi', String(useAi));
    const url = groupId
      ? `/api/groups/${groupId}/documents/extract/preview`
      : `${this.baseUrl}/extract/preview`;
    return this.http.post<DocumentExtractionPreview>(url, formData, { headers: this.headers });
  }

  /** Sube/actualiza la imagen asociada a un documento existente. */
  uploadImage(documentId: number, file: File): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<DocumentResponse>(`${this.baseUrl}/${documentId}/image`, formData, { headers: this.headers });
  }

  /** Actualiza un documento. Acepta cambios parciales y, opcionalmente, una nueva imagen. */
  updateDocument(id: number, body: Partial<Record<string, unknown>>, imageFile?: File | null): Observable<DocumentResponse> {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(body)], { type: 'application/json' }));
    if (imageFile) {
      formData.append('file', imageFile);
    }
    return this.http.put<DocumentResponse>(`${this.baseUrl}/${id}`, formData, { headers: this.headers });
  }

  /** Elimina un documento por su id. */
  deleteDocument(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers })
      .pipe(catchError((err) => this.handleError(err, 'No se pudo eliminar el documento')));
  }

  /**
   * Manejador centralizado de errores HTTP. Extrae un mensaje legible
   * y lo re-lanza con `throwError` para que los componentes puedan
   * reaccionar en el callback `error` de su `subscribe`.
   */
  private handleError(err: HttpErrorResponse, fallback: string): Observable<never> {
    const message = err.error?.error ?? err.error?.message ?? err.message ?? fallback;
    return throwError(() => new Error(message));
  }
}
