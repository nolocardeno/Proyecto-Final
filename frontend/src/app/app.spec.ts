// --------------------------------------------------------------------------
// TESTS: App (root component)
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, NavigationEnd } from '@angular/router';
import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Subject } from 'rxjs';

import { App } from './app';
import { AuthModalService } from './services/auth-modal.service';

describe('App (root component)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideLocationMocks(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('debe crearse correctamente', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('debe exponer la variante de footer por defecto', () => {
    const fixture = TestBed.createComponent(App);
    const cmp = fixture.componentInstance as unknown as { footerVariant: () => string };
    expect(cmp.footerVariant()).toBe('default');
  });

  it('debe cambiar la variante a with-sidebar al navegar a /dashboard', () => {
    const events$ = new Subject<unknown>();
    const router = TestBed.inject(Router) as unknown as { events: Subject<unknown> };
    // Sustituye el observable de eventos por un Subject controlable.
    Object.defineProperty(router, 'events', { value: events$, configurable: true });

    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const cmp = fixture.componentInstance as unknown as { footerVariant: () => string };

    events$.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    expect(cmp.footerVariant()).toBe('with-sidebar');

    events$.next(new NavigationEnd(2, '/', '/'));
    expect(cmp.footerVariant()).toBe('default');
  });

  it('debe leer el modal activo desde AuthModalService', () => {
    const fixture = TestBed.createComponent(App);
    const authModal = TestBed.inject(AuthModalService);
    authModal.openLogin();
    fixture.detectChanges();
    expect(authModal.activeModal()).toBe('login');
    authModal.close();
  });
});
