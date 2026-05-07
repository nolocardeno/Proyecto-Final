// --------------------------------------------------------------------------
// TESTS: PageTitleService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';

import { PageTitleService } from './page-title.service';

describe('PageTitleService', () => {
  let service: PageTitleService;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PageTitleService);
    title = TestBed.inject(Title);
  });

  it('setRouteTitle() formatea el título', () => {
    service.setRouteTitle('Dashboard');
    expect(title.getTitle()).toBe('Scantral | Dashboard');
  });

  it('setRouteTitle("") deja sólo "Scantral"', () => {
    service.setRouteTitle('');
    expect(title.getTitle()).toBe('Scantral');
  });

  it('setModalTitle() muestra el título del modal sin sobreescribir el de ruta', () => {
    service.setRouteTitle('Dashboard');
    service.setModalTitle('Login');
    expect(title.getTitle()).toBe('Scantral | Login');
    service.restoreRouteTitle();
    expect(title.getTitle()).toBe('Scantral | Dashboard');
  });
});
