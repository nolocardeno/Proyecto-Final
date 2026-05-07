// --------------------------------------------------------------------------
// TESTS: UserService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UserService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getUser() hace GET /api/users/:id', () => {
    service.getUser(3).subscribe();
    const req = http.expectOne('/api/users/3');
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('updateUser() hace PATCH con body', () => {
    service.updateUser(3, { name: 'X' }).subscribe();
    const req = http.expectOne('/api/users/3');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ name: 'X' });
    req.flush({});
  });

  it('uploadProfileImage() hace POST con FormData', () => {
    service.uploadProfileImage(3, new File(['x'], 'a.png')).subscribe();
    const req = http.expectOne('/api/users/3/profile-image');
    expect(req.request.method).toBe('POST');
    expect((req.request.body as FormData).get('file')).toBeTruthy();
    req.flush({});
  });

  it('deleteUser() hace DELETE /api/users/:id', () => {
    service.deleteUser(3).subscribe();
    const req = http.expectOne('/api/users/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
