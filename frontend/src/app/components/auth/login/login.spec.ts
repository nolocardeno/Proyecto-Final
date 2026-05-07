import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { LoginComponent } from './login';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { AuthModalService } from '../../../services/auth-modal.service';

describe('LoginComponent', () => {
  let auth: AuthService;
  let alert: AlertService;
  let modal: AuthModalService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    alert = TestBed.inject(AlertService);
    modal = TestBed.inject(AuthModalService);
    router = TestBed.inject(Router);
  });

  function build() {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return { fixture, comp: fixture.componentInstance as any };
  }

  it('precarga email recordado desde localStorage', () => {
    localStorage.setItem('scantral_remembered_email', 'me@x.com');
    const { comp } = build();
    expect(comp.loginForm.value.email).toBe('me@x.com');
    expect(comp.loginForm.value.rememberMe).toBeTrue();
  });

  it('no envía nada si el formulario es inválido', () => {
    const spy = spyOn(auth, 'login');
    const { comp } = build();
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('login exitoso navega al dashboard, cierra modal y muestra alerta', () => {
    spyOn(auth, 'login').and.returnValue(of({ id: 1, name: 'Ana', email: 'a@b.com' } as any));
    const alertSpy = spyOn(alert, 'show');
    const closeSpy = spyOn(modal, 'close');
    const navSpy = spyOn(router, 'navigate').and.resolveTo(true);
    const { comp } = build();
    comp.loginForm.setValue({ email: 'a@b.com', password: 'pw', rememberMe: true });
    comp.onSubmit();
    expect(localStorage.getItem('scantral_remembered_email')).toBe('a@b.com');
    expect(alertSpy).toHaveBeenCalledWith('success', jasmine.stringMatching(/Ana/));
    expect(closeSpy).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith(['/dashboard']);
  });

  it('login exitoso sin rememberMe elimina el email guardado', () => {
    localStorage.setItem('scantral_remembered_email', 'old@x.com');
    spyOn(auth, 'login').and.returnValue(of({ id: 1, name: 'Ana', email: 'a@b.com' } as any));
    spyOn(router, 'navigate').and.resolveTo(true);
    const { comp } = build();
    comp.loginForm.setValue({ email: 'a@b.com', password: 'pw', rememberMe: false });
    comp.onSubmit();
    expect(localStorage.getItem('scantral_remembered_email')).toBeNull();
  });

  it('login con error muestra alerta con mensaje del backend', () => {
    spyOn(auth, 'login').and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Mal' }, status: 401 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.loginForm.setValue({ email: 'a@b.com', password: 'pw', rememberMe: false });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', 'Mal');
  });

  it('login con error sin payload muestra mensaje genérico', () => {
    spyOn(auth, 'login').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.loginForm.setValue({ email: 'a@b.com', password: 'pw', rememberMe: false });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo iniciar sesión/));
  });
});
