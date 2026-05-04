// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthResponse } from './auth.service';

// --------------------------------------------------------------------------
// INTERFACES
// --------------------------------------------------------------------------

/** Cuerpo de la petición de actualización de un usuario. */
export interface UpdateUserRequest {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

// --------------------------------------------------------------------------
// SERVICIO: USER
// --------------------------------------------------------------------------

/**
 * Servicio CRUD del usuario actual: obtiene perfil, actualiza datos
 * (incluido cambio de contraseña), sube avatar vía `FormData` y
 * permite eliminar la cuenta.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/users';

  // TODO: get userId from auth system (Sprint 5). Temporary: userId = 3
  private readonly headers = new HttpHeaders();

  /** Devuelve los datos completos del usuario indicado. */
  getUser(userId: number): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.baseUrl}/${userId}`, { headers: this.headers });
  }

  /** Actualiza los datos del usuario (nombre, email, contraseña). */
  updateUser(userId: number, request: UpdateUserRequest): Observable<AuthResponse> {
    return this.http.patch<AuthResponse>(`${this.baseUrl}/${userId}`, request, { headers: this.headers });
  }

  /** Sube la imagen de perfil del usuario como `multipart/form-data`. */
  uploadProfileImage(userId: number, file: File): Observable<AuthResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<AuthResponse>(`${this.baseUrl}/${userId}/profile-image`, formData, {
      headers: this.headers,
    });
  }

  /** Elimina permanentemente al usuario indicado. */
  deleteUser(userId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${userId}`, { headers: this.headers });
  }
}
