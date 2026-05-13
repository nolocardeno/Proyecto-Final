// --------------------------------------------------------------------------
// TESTS: authGuard
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('redirige a / si no hay sesión activa', () => {
    const router = TestBed.inject(Router);
    const expected = router.createUrlTree(['/']);
    const result = runGuard() as UrlTree;
    expect(result.toString()).toBe(expected.toString());
  });

  it('permite el acceso si hay sesión activa', () => {
    TestBed.inject(AuthService).setUser({
      userId: 1,
      email: 'a@b.com',
      name: 'M',
      profileImagePath: null,
      token: 'tk',
    });
    expect(runGuard()).toBeTrue();
  });
});
