// --------------------------------------------------------------------------
// TESTS: AuthModalService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';

import { AuthModalService } from './auth-modal.service';

describe('AuthModalService', () => {
  let service: AuthModalService;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthModalService);
    title = TestBed.inject(Title);
  });

  it('inicia con ningún modal activo', () => {
    expect(service.activeModal()).toBeNull();
  });

  it('openLogin() activa el modal de login y actualiza el título', () => {
    service.openLogin();
    expect(service.activeModal()).toBe('login');
    expect(title.getTitle()).toBe('Scantral | Iniciar sesión');
  });

  it('openRegister() activa el modal de registro y actualiza el título', () => {
    service.openRegister();
    expect(service.activeModal()).toBe('register');
    expect(title.getTitle()).toBe('Scantral | Registro');
  });

  it('close() resetea el modal y restaura el título de ruta', () => {
    service.openLogin();
    service.close();
    expect(service.activeModal()).toBeNull();
    // restoreRouteTitle por defecto vuelve al valor inicial 'Scantral'
    expect(title.getTitle()).toBe('Scantral');
  });
});
