// --------------------------------------------------------------------------
// TESTS: UploadDocumentModalService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';

import { UploadDocumentModalService } from './upload-document-modal.service';

describe('UploadDocumentModalService', () => {
  let service: UploadDocumentModalService;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UploadDocumentModalService);
    title = TestBed.inject(Title);
  });

  it('inicia cerrado y sin grupo', () => {
    expect(service.isOpen()).toBeFalse();
    expect(service.groupId()).toBeNull();
  });

  it('open() sin grupo deja groupId en null', () => {
    service.open();
    expect(service.isOpen()).toBeTrue();
    expect(service.groupId()).toBeNull();
    expect(title.getTitle()).toBe('Scantral | Subir documento');
  });

  it('open(groupId) almacena el id de grupo', () => {
    service.open(7);
    expect(service.groupId()).toBe(7);
  });

  it('close() limpia el estado y restaura el título', () => {
    service.open(5);
    service.close();
    expect(service.isOpen()).toBeFalse();
    expect(service.groupId()).toBeNull();
    expect(title.getTitle()).toBe('Scantral');
  });
});
