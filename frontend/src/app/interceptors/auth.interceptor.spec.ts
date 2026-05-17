// --------------------------------------------------------------------------
// TESTS: authInterceptor
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => ctrl.verify());

  it('NO añade Authorization si no hay token', () => {
    http.get('/api/documents').subscribe();
    const req = ctrl.expectOne('/api/documents');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush(null);
  });

  it('NO añade Authorization a llamadas externas', () => {
    auth.setUser({ userId: 1, email: 'a@b', name: 'a', profileImagePath: null, token: 'tk' });
    http.get('https://example.com/data').subscribe();
    const req = ctrl.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush(null);
  });

  it('NO añade Authorization a /api/auth/**', () => {
    auth.setUser({ userId: 1, email: 'a@b', name: 'a', profileImagePath: null, token: 'tk' });
    http.post('/api/auth/login', {}).subscribe();
    const req = ctrl.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush(null);
  });

  it('Añade Authorization Bearer al resto de /api/**', () => {
    auth.setUser({ userId: 1, email: 'a@b', name: 'a', profileImagePath: null, token: 'tk' });
    http.get('/api/documents').subscribe();
    const req = ctrl.expectOne('/api/documents');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tk');
    req.flush(null);
  });

  it('cierra sesión y redirige a / al recibir 401 en endpoint protegido', () => {
    auth.setUser({ userId: 1, email: 'a@b', name: 'a', profileImagePath: null, token: 'tk' });
    http.get('/api/documents').subscribe({ error: (_e: HttpErrorResponse) => {} });
    const req = ctrl.expectOne('/api/documents');
    req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    expect(auth.isLoggedIn()).toBeFalse();
  });
});
