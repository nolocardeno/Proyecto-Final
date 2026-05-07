// --------------------------------------------------------------------------
// TESTS: DocumentService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DocumentService } from './document.service';
import { AuthService } from './auth.service';

describe('DocumentService', () => {
  let service: DocumentService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentService);
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).setUser({
      userId: 1,
      email: 'a@b.com',
      name: 'M',
      profileImagePath: null,
      token: 'tk',
    });
  });

  afterEach(() => http.verify());

  it('getDocuments() hace GET a /api/documents', () => {
    let res: unknown;
    service.getDocuments().subscribe((r) => (res = r));
    const req = http.expectOne('/api/documents');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);
    expect(res).toEqual([{ id: 1 }] as unknown[]);
  });

  it('getDocuments() propaga error legible', (done) => {
    service.getDocuments().subscribe({
      error: (e: Error) => {
        expect(e.message).toBe('boom');
        done();
      },
    });
    http
      .expectOne('/api/documents')
      .flush({ error: 'boom' }, { status: 500, statusText: 'err' });
  });

  it('getDocument() hace GET a /api/documents/:id', () => {
    service.getDocument(42).subscribe();
    const req = http.expectOne('/api/documents/42');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 42 });
  });

  it('getDocument() propaga un Error al fallar', (done) => {
    service.getDocument(1).subscribe({
      error: (e: Error) => {
        expect(e).toEqual(jasmine.any(Error));
        done();
      },
    });
    http.expectOne('/api/documents/1').flush({}, { status: 500, statusText: 'err' });
  });

  it('createDocument() envía multipart sin grupo y sin archivo', () => {
    service.createDocument({ title: 'X' }).subscribe();
    const req = http.expectOne('/api/documents');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    req.flush({ id: 1 });
  });

  it('createDocument() incluye archivo y usa endpoint de grupo cuando se indica', () => {
    const file = new File(['data'], 'a.png', { type: 'image/png' });
    service.createDocument({ title: 'X' }, 9, file).subscribe();
    const req = http.expectOne('/api/groups/9/documents');
    const fd = req.request.body as FormData;
    expect(fd.get('file')).toEqual(file);
    expect(fd.get('data')).toBeTruthy();
    req.flush({ id: 1 });
  });

  it('extractFromImage() POSTea al endpoint /extract con flag useAi', () => {
    const file = new File(['x'], 'a.png');
    service.extractFromImage(file, true).subscribe();
    const req = http.expectOne('/api/documents/extract');
    expect((req.request.body as FormData).get('useAi')).toBe('true');
    req.flush({ id: 1 });
  });

  it('extractFromImage() usa endpoint de grupo si se indica', () => {
    const file = new File(['x'], 'a.png');
    service.extractFromImage(file, false, 5).subscribe();
    const req = http.expectOne('/api/groups/5/documents/extract');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 1 });
  });

  it('uploadImage() POSTea al endpoint /:id/image', () => {
    service.uploadImage(7, new File(['x'], 'a.png')).subscribe();
    const req = http.expectOne('/api/documents/7/image');
    expect(req.request.method).toBe('POST');
    req.flush({ id: 7 });
  });

  it('updateDocument() hace PUT con multipart', () => {
    service.updateDocument(7, { title: 'B' }).subscribe();
    const req = http.expectOne('/api/documents/7');
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 7 });
  });

  it('updateDocument() incluye archivo cuando se proporciona', () => {
    service.updateDocument(7, { title: 'B' }, new File(['x'], 'a.png')).subscribe();
    const req = http.expectOne('/api/documents/7');
    expect((req.request.body as FormData).get('file')).toBeTruthy();
    req.flush({ id: 7 });
  });

  it('deleteDocument() hace DELETE y propaga error legible', (done) => {
    service.deleteDocument(3).subscribe();
    http.expectOne('/api/documents/3').flush(null);

    service.deleteDocument(3).subscribe({
      error: (e: Error) => {
        expect(e.message).toBe('not found');
        done();
      },
    });
    http
      .expectOne('/api/documents/3')
      .flush({ error: 'not found' }, { status: 404, statusText: 'NF' });
  });
});
