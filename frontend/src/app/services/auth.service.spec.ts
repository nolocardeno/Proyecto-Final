// --------------------------------------------------------------------------
// TESTS: AuthService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthResponse, AuthService } from './auth.service';

const STORAGE_KEY = 'scantral_user';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const sampleUser: AuthResponse = {
    userId: 7,
    email: 'a@b.com',
    name: 'Manolo',
    profileImagePath: '/img.png',
    role: 'USER',
    token: 'jwt-123',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  // ------------------------------------------------------------------------
  // Estado inicial / persistencia
  // ------------------------------------------------------------------------
  it('debe inicializarse sin sesión cuando no hay datos en storage', () => {
    expect(service.user()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(service.isAdmin()).toBeFalse();
    expect(service.getToken()).toBeNull();
    expect(service.profileImageUrl()).toBe('');
  });

  it('debe cargar el usuario almacenado en localStorage al iniciar', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleUser));
    // Reinicializa el servicio creando un nuevo TestBed-scope
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.user()?.email).toBe('a@b.com');
    expect(fresh.isLoggedIn()).toBeTrue();
    expect(fresh.getToken()).toBe('jwt-123');
  });

  it('debe ignorar JSON corrupto en storage y considerar sin sesión', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fresh = TestBed.inject(AuthService);
    expect(fresh.user()).toBeNull();
  });

  // ------------------------------------------------------------------------
  // login / register / logout
  // ------------------------------------------------------------------------
  it('login() persiste el usuario en signal y storage', () => {
    let received: AuthResponse | undefined;
    service.login({ email: 'a@b.com', password: 'x' }).subscribe((r) => (received = r));
    const req = http.expectOne('/api/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush(sampleUser);

    expect(received).toEqual(sampleUser);
    expect(service.user()?.email).toBe('a@b.com');
    expect(service.isLoggedIn()).toBeTrue();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('a@b.com');
  });

  it('login() reintenta una vez ante error y termina exitosamente', (done) => {
    service.login({ email: 'a@b.com', password: 'x' }).subscribe({
      next: (r) => {
        expect(r).toEqual(sampleUser);
        done();
      },
    });
    const first = http.expectOne('/api/auth/login');
    first.error(new ProgressEvent('Network error'), { status: 0, statusText: 'err' });
    setTimeout(() => {
      const second = http.expectOne('/api/auth/login');
      second.flush(sampleUser);
    }, 350);
  });

  it('login() propaga un Error tras agotar el reintento', (done) => {
    service.login({ email: 'a@b.com', password: 'bad' }).subscribe({
      error: (err: Error) => {
        expect(err).toEqual(jasmine.any(Error));
        expect(err.message).toBeTruthy();
        done();
      },
    });
    http.expectOne('/api/auth/login').error(new ProgressEvent('e'), { status: 0, statusText: '' });
    setTimeout(() => {
      http
        .expectOne('/api/auth/login')
        .flush(null, { status: 401, statusText: 'Unauthorized' });
    }, 350);
  });

  it('register() devuelve el usuario y propaga error legible del backend', () => {
    let res: AuthResponse | undefined;
    service.register({ email: 'a@b.com', password: 'x' }).subscribe((r) => (res = r));
    http.expectOne('/api/auth/register').flush(sampleUser);
    expect(res).toEqual(sampleUser);

    let captured: Error | undefined;
    service.register({ email: 'a@b.com', password: 'x' }).subscribe({ error: (e) => (captured = e) });
    http
      .expectOne('/api/auth/register')
      .flush({ error: 'Email duplicado' }, { status: 409, statusText: 'Conflict' });
    expect(captured?.message).toBe('Email duplicado');
  });

  it('logout() limpia el signal y el storage', () => {
    service.setUser(sampleUser);
    expect(service.isLoggedIn()).toBeTrue();
    service.logout();
    expect(service.user()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  // ------------------------------------------------------------------------
  // setUser / token / imagen / admin
  // ------------------------------------------------------------------------
  it('setUser() conserva el token previo cuando no llega en el payload', () => {
    service.setUser(sampleUser);
    service.setUser({ ...sampleUser, token: undefined, role: undefined } as AuthResponse);
    expect(service.getToken()).toBe('jwt-123');
    expect(service.user()?.role).toBe('USER');
  });

  it('isAdmin() es true sólo cuando el rol es ADMIN', () => {
    service.setUser({ ...sampleUser, role: 'ADMIN' });
    expect(service.isAdmin()).toBeTrue();
    service.setUser({ ...sampleUser, role: 'USER' });
    expect(service.isAdmin()).toBeFalse();
  });

  it('profileImageUrl() expone una URL con cache-buster para el avatar', () => {
    service.setUser(sampleUser);
    const url = service.profileImageUrl();
    expect(url).toMatch(/^\/api\/users\/7\/profile-image\?v=\d+$/);
  });

  it('profileImageUrl() es vacío si el usuario no tiene imagen', () => {
    service.setUser({ ...sampleUser, profileImagePath: null });
    expect(service.profileImageUrl()).toBe('');
  });
});
