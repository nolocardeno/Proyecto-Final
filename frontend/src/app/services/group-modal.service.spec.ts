// --------------------------------------------------------------------------
// TESTS: GroupModalService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';

import { GroupModalService } from './group-modal.service';

describe('GroupModalService', () => {
  let service: GroupModalService;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GroupModalService);
    title = TestBed.inject(Title);
  });

  it('inicia cerrado', () => {
    expect(service.isOpen()).toBeFalse();
  });

  it('open() abre el modal y actualiza el título', () => {
    service.open();
    expect(service.isOpen()).toBeTrue();
    expect(title.getTitle()).toBe('Scantral | Crear grupo');
  });

  it('close() cierra y restaura el título', () => {
    service.open();
    service.close();
    expect(service.isOpen()).toBeFalse();
    expect(title.getTitle()).toBe('Scantral');
  });
});
