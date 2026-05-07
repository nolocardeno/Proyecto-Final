// --------------------------------------------------------------------------
// TESTS: authRedirectGuard
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

import { authRedirectGuard } from './auth-redirect.guard';
import { AuthService } from '../services/auth.service';

function runGuard() {
  return TestBed.runInInjectionContext(() =>
    authRedirectGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
  );
}

describe('authRedirectGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('permite el acceso si no hay sesión', () => {
    expect(runGuard()).toBeTrue();
  });

  it('redirige a /dashboard si hay sesión activa', () => {
    TestBed.inject(AuthService).setUser({
      userId: 1,
      email: 'a@b.com',
      name: 'M',
      profileImagePath: null,
      token: 'tk',
    });
    const router = TestBed.inject(Router);
    const expected = router.createUrlTree(['/dashboard']);
    const result = runGuard() as UrlTree;
    expect(result.toString()).toBe(expected.toString());
  });
});
