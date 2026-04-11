// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GroupRequest, GroupResponse } from '../models/group.model';
import { AuthService } from './auth.service';

// --------------------------------------------------------------------------
// SERVICIO: GROUP
// --------------------------------------------------------------------------
@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly baseUrl = '/api/groups';

  private get headers(): HttpHeaders {
    const userId = this.authService.user()?.userId ?? 0;
    return new HttpHeaders({ 'X-User-Id': String(userId) });
  }

  getGroups(): Observable<GroupResponse[]> {
    return this.http.get<GroupResponse[]>(this.baseUrl, { headers: this.headers });
  }

  getGroup(id: number): Observable<GroupResponse> {
    return this.http.get<GroupResponse>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }

  createGroup(request: GroupRequest): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(this.baseUrl, request, { headers: this.headers });
  }

  deleteGroup(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`, { headers: this.headers });
  }
}
