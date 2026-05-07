import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { RegisterComponent } from './register';
import { AuthService } from '../../../services/auth.service';
import { AlertService } from '../../../services/alert.service';
import { AuthModalService } from '../../../services/auth-modal.service';

describe('RegisterComponent', () => {
  let auth: AuthService;
  let alert: AlertService;
  let modal: AuthModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    auth = TestBed.inject(AuthService);
    alert = TestBed.inject(AlertService);
    modal = TestBed.inject(AuthModalService);
  });

  function build() {
    const fx = TestBed.createComponent(RegisterComponent);
    fx.detectChanges();
    return { fx, comp: fx.componentInstance as any };
  }

  it('no envía con formulario inválido', () => {
    const spy = spyOn(auth, 'register');
    const { comp } = build();
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('no envía si las contraseñas no coinciden (form inválido)', () => {
    const spy = spyOn(auth, 'register');
    const { comp } = build();
    comp.registerForm.setValue({
      email: 'a@b.com',
      password: '123456',
      confirmPassword: 'distinto',
    });
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
    expect(comp.registerForm.hasError('passwordsMismatch')).toBeTrue();
  });

  it('registro exitoso abre login y muestra alerta', () => {
    spyOn(auth, 'register').and.returnValue(of(undefined as any));
    const alertSpy = spyOn(alert, 'show');
    const openSpy = spyOn(modal, 'openLogin');
    const { comp } = build();
    comp.registerForm.setValue({
      email: 'a@b.com',
      password: '123456',
      confirmPassword: '123456',
    });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('success', jasmine.stringMatching(/creada/i));
    expect(openSpy).toHaveBeenCalled();
  });

  it('error de registro muestra mensaje del backend', () => {
    spyOn(auth, 'register').and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Email en uso' }, status: 409 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.registerForm.setValue({
      email: 'a@b.com',
      password: '123456',
      confirmPassword: '123456',
    });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', 'Email en uso');
  });

  it('error de registro sin payload usa mensaje genérico', () => {
    spyOn(auth, 'register').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.registerForm.setValue({
      email: 'a@b.com',
      password: '123456',
      confirmPassword: '123456',
    });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo crear/));
  });
});
