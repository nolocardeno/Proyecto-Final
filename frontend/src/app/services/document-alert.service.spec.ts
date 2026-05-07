// --------------------------------------------------------------------------
// TESTS: DocumentAlertService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DocumentAlertService } from './document-alert.service';

describe('DocumentAlertService', () => {
  let service: DocumentAlertService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentAlertService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getAlerts() hace GET al endpoint correspondiente', () => {
    service.getAlerts(5).subscribe();
    const req = http.expectOne('/api/documents/5/alerts');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('createAlert() hace POST con daysBeforeExpiry', () => {
    service.createAlert(5, 7).subscribe();
    const req = http.expectOne('/api/documents/5/alerts');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ daysBeforeExpiry: 7 });
    req.flush({ id: 1 });
  });

  it('deleteAlert() hace DELETE al endpoint anidado', () => {
    service.deleteAlert(5, 9).subscribe();
    const req = http.expectOne('/api/documents/5/alerts/9');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
