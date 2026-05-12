import { TestBed } from '@angular/core/testing';
import { CookieConsentService } from './cookie-consent.service';

describe('CookieConsentService', () => {
  const STORAGE_KEY = 'scantral_cookie_consent';
  let service: CookieConsentService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(CookieConsentService);
  });

  afterEach(() => localStorage.removeItem(STORAGE_KEY));

  it('arranca en estado pending cuando no hay valor almacenado', () => {
    expect(service.status()).toBe('pending');
    expect(service.isPending()).toBeTrue();
    expect(service.isAccepted()).toBeFalse();
  });

  it('accept persiste el valor en localStorage', () => {
    service.accept();
    expect(service.status()).toBe('accepted');
    expect(service.isAccepted()).toBeTrue();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('accepted');
  });

  it('reject persiste el valor en localStorage', () => {
    service.reject();
    expect(service.status()).toBe('rejected');
    expect(service.isPending()).toBeFalse();
    expect(localStorage.getItem(STORAGE_KEY)).toBe('rejected');
  });

  it('reset vuelve al estado pending y limpia el almacenamiento', () => {
    service.accept();
    service.reset();
    expect(service.status()).toBe('pending');
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('carga el valor previamente almacenado al instanciarse', () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    const fresh = new CookieConsentService();
    expect(fresh.status()).toBe('accepted');
  });

  it('ignora valores corruptos en localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'foo');
    const fresh = new CookieConsentService();
    expect(fresh.status()).toBe('pending');
  });
});
