// --------------------------------------------------------------------------
// TESTS: GroupService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { GroupService } from './group.service';

describe('GroupService', () => {
  let service: GroupService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(GroupService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getGroups() hace GET /api/groups', () => {
    service.getGroups().subscribe();
    const req = http.expectOne('/api/groups');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('getGroup() hace GET /api/groups/:id', () => {
    service.getGroup(7).subscribe();
    const req = http.expectOne('/api/groups/7');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7 });
  });

  it('getGroupDetail() hace GET /api/groups/:id/detail', () => {
    service.getGroupDetail(7).subscribe();
    const req = http.expectOne('/api/groups/7/detail');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7 });
  });

  it('getGroupDocuments() hace GET /api/groups/:id/documents', () => {
    service.getGroupDocuments(7).subscribe();
    const req = http.expectOne('/api/groups/7/documents');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createGroup() hace POST /api/groups con cuerpo', () => {
    service.createGroup({ name: 'G', allCanAddDocuments: true }).subscribe();
    const req = http.expectOne('/api/groups');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'G', allCanAddDocuments: true });
    req.flush({ id: 1 });
  });

  it('deleteGroup() hace DELETE /api/groups/:id', () => {
    service.deleteGroup(3).subscribe();
    const req = http.expectOne('/api/groups/3');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('leaveGroup() hace DELETE /api/groups/:id/leave', () => {
    service.leaveGroup(3).subscribe();
    const req = http.expectOne('/api/groups/3/leave');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('joinGroup() hace POST /api/groups/join con accessCode', () => {
    service.joinGroup('ABC').subscribe();
    const req = http.expectOne('/api/groups/join');
    expect(req.request.body).toEqual({ accessCode: 'ABC' });
    req.flush({ id: 1 });
  });
});
