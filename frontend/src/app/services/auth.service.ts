// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, tap } from 'rxjs/operators';

// --------------------------------------------------------------------------
// INTERFACES
// --------------------------------------------------------------------------

/** Datos del usuario autenticado devueltos por el backend. */
export interface AuthResponse {
  userId: number;
  email: string;
  name: string;
  profileImagePath: string | null;
}

/** Cuerpo de la petición de inicio de sesión. */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Cuerpo de la petición de registro de usuario. */
export interface RegisterRequest {
  email: string;
  password: string;
}

// --------------------------------------------------------------------------
// SERVICIO: AUTH (HTTP + Session state)
// --------------------------------------------------------------------------

/**
 * Servicio de autenticación.
 *
 * Encapsula las llamadas HTTP de login/registro y mantiene el estado de la
 * sesión del usuario en memoria (mediante un `signal`) y persistido en
 * `localStorage`, de modo que la sesión sobrevive a recargas de página.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/auth';
  private readonly STORAGE_KEY = 'scantral_user';

  /** Estado reactivo del usuario actual (null = sin sesión). */
  private readonly _user = signal<AuthResponse | null>(this.loadUser());
  /** Versión usada para invalidar la caché de la imagen de perfil. */
  private readonly _imageVersion = signal(Date.now());

  /** Usuario autenticado en modo sólo lectura. */
  readonly user = this._user.asReadonly();
  /** `true` cuando hay un usuario autenticado. */
  readonly isLoggedIn = computed(() => this._user() !== null);
  /** URL de la imagen de perfil con cache-buster (cadena vacía si no hay). */
  readonly profileImageUrl = computed(() => {
    const user = this._user();
    if (!user?.profileImagePath) return '';
    const v = this._imageVersion();
    return `/api/users/${user.userId}/profile-image?v=${v}`;
  });

  /** Registra un nuevo usuario en el backend. */
  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, request).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err, 'No se pudo completar el registro')),
    );
  }

  /**
   * Inicia sesión.
   *
   * Pipeline RxJS aplicada:
   *  - `retry({ count: 1 })`: reintenta una vez para tolerar fallos
   *    transitorios de red.
   *  - `tap`: efecto secundario que persiste la sesión cuando la
   *    respuesta es satisfactoria.
   *  - `catchError`: transforma el error HTTP en un mensaje legible y
   *    lo re-emite con `throwError` para que el componente pueda
   *    reaccionar en su `subscribe({ error })`.
   */
  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      retry({ count: 1, delay: 300 }),
      tap((res) => this.setUser(res)),
      catchError((err: HttpErrorResponse) => this.handleError(err, 'Credenciales incorrectas')),
    );
  }

  /** Cierra la sesión local: limpia el signal y el almacenamiento. */
  logout(): void {
    this._user.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /** Persiste el usuario y refresca la versión del avatar. */
  setUser(user: AuthResponse): void {
    this._user.set(user);
    this._imageVersion.set(Date.now());
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
  }

  /** Recupera el usuario almacenado en `localStorage` (si lo hay). */
  private loadUser(): AuthResponse | null {
    const raw = localStorage.getItem('scantral_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      // JSON corrupto: ignoramos y forzamos sesión vacía.
      return null;
    }
  }

  /**
   * Centraliza el manejo de errores HTTP.
   *
   * Extrae un mensaje legible (preferentemente del backend) y devuelve
   * un `Observable` que se lanza con `throwError`, permitiendo que la
   * cadena RxJS lo propague hasta los `subscribe({ error })` del
   * componente que invoca al servicio.
   */
  private handleError(err: HttpErrorResponse, fallback: string): Observable<never> {
    const message = err.error?.error ?? err.error?.message ?? err.message ?? fallback;
    return throwError(() => new Error(message));
  }
}
