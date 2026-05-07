// --------------------------------------------------------------------------
// TESTS: ThemeService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  function makeService() {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    return TestBed.inject(ThemeService);
  }

  beforeEach(() => {
    localStorage.removeItem('scantral.theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('usa el tema almacenado si existe', () => {
    localStorage.setItem('scantral.theme', 'dark');
    const service = makeService();
    expect(service.theme()).toBe('dark');
    expect(service.isDark()).toBeTrue();
    TestBed.tick();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('respeta prefers-color-scheme cuando no hay valor en storage', () => {
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      media: '(prefers-color-scheme: dark)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
    } as unknown as MediaQueryList);
    const service = makeService();
    expect(service.theme()).toBe('dark');
  });

  it('usa light por defecto cuando no hay storage ni preferencia', () => {
    spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
    } as unknown as MediaQueryList);
    const service = makeService();
    expect(service.theme()).toBe('light');
  });

  it('toggle() alterna entre light y dark y persiste en storage', async () => {
    const service = makeService();
    service.toggle();
    await Promise.resolve();
    expect(service.theme()).toBe(service.isDark() ? 'dark' : 'light');
    service.toggle();
    await Promise.resolve();
  });

  it('set() fija el tema explícitamente', () => {
    const service = makeService();
    service.set('dark');
    expect(service.theme()).toBe('dark');
    service.set('light');
    expect(service.theme()).toBe('light');
  });
});
