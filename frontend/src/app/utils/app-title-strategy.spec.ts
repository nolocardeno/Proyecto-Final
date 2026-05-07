// --------------------------------------------------------------------------
// TESTS: AppTitleStrategy
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { AppTitleStrategy } from './app-title-strategy';
import { PageTitleService } from '../services/page-title.service';

describe('AppTitleStrategy', () => {
  let strategy: AppTitleStrategy;
  let pageTitle: PageTitleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    strategy = TestBed.inject(AppTitleStrategy);
    pageTitle = TestBed.inject(PageTitleService);
  });

  it('actualiza el título de ruta vía PageTitleService', () => {
    const spy = spyOn(pageTitle, 'setRouteTitle');
    const router = TestBed.inject(Router);
    const snapshot = router.routerState.snapshot;
    spyOn(strategy, 'buildTitle').and.returnValue('Demo');
    strategy.updateTitle(snapshot);
    expect(spy).toHaveBeenCalledWith('Demo');
  });

  it('pasa cadena vacía cuando buildTitle devuelve undefined', () => {
    const spy = spyOn(pageTitle, 'setRouteTitle');
    spyOn(strategy, 'buildTitle').and.returnValue(undefined);
    strategy.updateTitle(TestBed.inject(Router).routerState.snapshot);
    expect(spy).toHaveBeenCalledWith('');
    expect(TestBed.inject(Title).getTitle()).toBeDefined();
  });
});
