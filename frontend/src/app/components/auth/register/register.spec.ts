import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
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
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideLocationMocks(),
      ],
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
      password: 'Pass1234!',
      confirmPassword: 'Distinto1!',
      acceptTerms: true,
    });
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
    expect(comp.registerForm.hasError('passwordsMismatch')).toBeTrue();
  });

  it('no envía si no se aceptan los términos', () => {
    const spy = spyOn(auth, 'register');
    const { comp } = build();
    comp.registerForm.setValue({
      email: 'a@b.com',
      password: 'Pass1234!',
      confirmPassword: 'Pass1234!',
      acceptTerms: false,
    });
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
    expect(comp.registerForm.get('acceptTerms')!.valid).toBeFalse();
  });

  it('registro exitoso abre login y muestra alerta', () => {
    spyOn(auth, 'register').and.returnValue(of(undefined as any));
    const alertSpy = spyOn(alert, 'show');
    const openSpy = spyOn(modal, 'openLogin');
    const { comp } = build();
    comp.registerForm.setValue({
      email: 'a@b.com',
      password: 'Pass1234!',
      confirmPassword: 'Pass1234!',
      acceptTerms: true,
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
      password: 'Pass1234!',
      confirmPassword: 'Pass1234!',
      acceptTerms: true,
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
      password: 'Pass1234!',
      confirmPassword: 'Pass1234!',
      acceptTerms: true,
    });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo crear/));
  });

  // -------------------------------------------------------------------------
  // passwordStrengthValidator — cobertura de ramas
  // -------------------------------------------------------------------------
  describe('passwordStrengthValidator', () => {
    it('acepta contraseña válida (todos los requisitos)', () => {
      const { comp } = build();
      comp.registerForm.get('password').setValue('Pass1234!');
      expect(comp.registerForm.get('password').valid).toBeTrue();
    });

    it('error passwordTooShort cuando tiene menos de 8 caracteres', () => {
      const { comp } = build();
      comp.registerForm.get('password').setValue('Ab1!');
      expect(comp.registerForm.get('password').hasError('passwordTooShort')).toBeTrue();
    });

    it('error passwordMissingUppercase cuando falta mayúscula', () => {
      const { comp } = build();
      comp.registerForm.get('password').setValue('pass1234!');
      expect(comp.registerForm.get('password').hasError('passwordMissingUppercase')).toBeTrue();
    });

    it('error passwordMissingLowercase cuando falta minúscula', () => {
      const { comp } = build();
      comp.registerForm.get('password').setValue('PASS1234!');
      expect(comp.registerForm.get('password').hasError('passwordMissingLowercase')).toBeTrue();
    });

    it('error passwordMissingSpecial cuando falta carácter especial', () => {
      const { comp } = build();
      comp.registerForm.get('password').setValue('Password1');
      expect(comp.registerForm.get('password').hasError('passwordMissingSpecial')).toBeTrue();
    });

    it('retorna null para campo vacío (required lo gestiona)', () => {
      const { comp } = build();
      comp.registerForm.get('password').setValue('');
      expect(comp.registerForm.get('password').hasError('passwordTooShort')).toBeFalse();
      expect(comp.registerForm.get('password').hasError('required')).toBeTrue();
    });

    it('retorna null cuando el valor del control es null', () => {
      const { comp } = build();
      comp.registerForm.get('password').setValue(null);
      expect(comp.registerForm.get('password').hasError('passwordTooShort')).toBeFalse();
    });
  });
});
