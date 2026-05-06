// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GroupRequest, GroupResponse, GroupDetailResponse } from '../models/group.model';
import { DocumentResponse } from '../models/document.model';
import { AuthService } from './auth.service';

// --------------------------------------------------------------------------
// SERVICIO: GROUP
// --------------------------------------------------------------------------

/**
 * Servicio CRUD de grupos compartidos.
 *
 * Expone operaciones HTTP sobre `/api/groups` envueltas en `Observable` de
 * RxJS, lo que permite a los componentes suscribirse a la respuesta y
 * actualizar dinámicamente la vista cuando llegan los datos.
 */
@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/groups';

  /** Cabeceras con el identificador del usuario autenticado. */
  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders();
  }

  /** Lista todos los grupos del usuario. */
  getGroups(): Observable<GroupResponse[]> {
    return this.http.get<GroupResponse[]>(this.baseUrl, { headers: this.headers });
  }

  /** Obtiene un grupo por id. */
  getGroup(id: number): Observable<GroupResponse> {
    return this.http.get<GroupResponse>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  /** Obtiene el detalle completo de un grupo (incluye miembros y código). */
  getGroupDetail(id: number): Observable<GroupDetailResponse> {
    return this.http.get<GroupDetailResponse>(`${this.baseUrl}/${id}/detail`, { headers: this.headers });
  }

  /** Documentos pertenecientes a un grupo. */
  getGroupDocuments(id: number): Observable<DocumentResponse[]> {
    return this.http.get<DocumentResponse[]>(`${this.baseUrl}/${id}/documents`, { headers: this.headers });
  }

  /** Crea un nuevo grupo. */
  createGroup(request: GroupRequest): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(this.baseUrl, request, { headers: this.headers });
  }

  /** Elimina un grupo por id. */
  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  /** Abandona un grupo del que el usuario es miembro (no creador). */
  leaveGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}/leave`, { headers: this.headers });
  }

  /** Une al usuario actual a un grupo mediante su código de acceso. */
  joinGroup(accessCode: string): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(`${this.baseUrl}/join`, { accessCode }, { headers: this.headers });
  }
}
