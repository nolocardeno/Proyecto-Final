// --------------------------------------------------------------------------
// TESTS: SidebarService
// --------------------------------------------------------------------------
import { TestBed } from '@angular/core/testing';

import { SidebarService } from './sidebar.service';

describe('SidebarService', () => {
  let service: SidebarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SidebarService);
  });

  it('inicia cerrado', () => {
    expect(service.isOpen()).toBeFalse();
  });

  it('open()/close()/toggle() controlan el flag', () => {
    service.open();
    expect(service.isOpen()).toBeTrue();
    service.close();
    expect(service.isOpen()).toBeFalse();
    service.toggle();
    expect(service.isOpen()).toBeTrue();
    service.toggle();
    expect(service.isOpen()).toBeFalse();
  });
});
