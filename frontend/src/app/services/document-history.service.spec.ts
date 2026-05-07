// --------------------------------------------------------------------------
// TESTS: DocumentHistoryService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DocumentHistoryService } from './document-history.service';

describe('DocumentHistoryService', () => {
  let service: DocumentHistoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DocumentHistoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getHistory() hace GET /api/documents/:id/history', () => {
    service.getHistory(11).subscribe();
    const req = http.expectOne('/api/documents/11/history');
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });
});
