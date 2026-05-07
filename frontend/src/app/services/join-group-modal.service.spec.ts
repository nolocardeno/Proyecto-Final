// --------------------------------------------------------------------------
// TESTS: JoinGroupModalService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';

import { JoinGroupModalService } from './join-group-modal.service';

describe('JoinGroupModalService', () => {
  let service: JoinGroupModalService;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JoinGroupModalService);
    title = TestBed.inject(Title);
  });

  it('inicia cerrado', () => {
    expect(service.isOpen()).toBeFalse();
  });

  it('open() abre y fija el título', () => {
    service.open();
    expect(service.isOpen()).toBeTrue();
    expect(title.getTitle()).toBe('Scantral | Unirse a grupo');
  });

  it('close() cierra y restaura el título', () => {
    service.open();
    service.close();
    expect(service.isOpen()).toBeFalse();
    expect(title.getTitle()).toBe('Scantral');
  });
});
