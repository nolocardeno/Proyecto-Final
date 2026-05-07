import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { CreateGroupModalComponent } from './create-group-modal';
import { GroupService } from '../../../services/group.service';
import { GroupModalService } from '../../../services/group-modal.service';
import { AlertService } from '../../../services/alert.service';

describe('CreateGroupModalComponent', () => {
  let groupService: GroupService;
  let modal: GroupModalService;
  let alert: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateGroupModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    groupService = TestBed.inject(GroupService);
    modal = TestBed.inject(GroupModalService);
    alert = TestBed.inject(AlertService);
  });

  function build() {
    const fx = TestBed.createComponent(CreateGroupModalComponent);
    fx.detectChanges();
    return fx.componentInstance as any;
  }

  it('onModalClosed cierra el modal', () => {
    const spy = spyOn(modal, 'close');
    build().onModalClosed();
    expect(spy).toHaveBeenCalled();
  });

  it('onSubmit con form inválido no llama al servicio', () => {
    const spy = spyOn(groupService, 'createGroup');
    build().onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onSubmit con éxito (addPolicy="all") emite y cierra', () => {
    spyOn(groupService, 'createGroup').and.returnValue(of({ id: 1 } as any));
    const alertSpy = spyOn(alert, 'show');
    const closeSpy = spyOn(modal, 'close');
    const c = build();
    let emitted = false;
    c.groupCreated.subscribe(() => (emitted = true));
    c.createForm.setValue({ name: 'Grupo', addPolicy: 'all' });
    c.onSubmit();
    expect(groupService.createGroup).toHaveBeenCalledWith({ name: 'Grupo', allCanAddDocuments: true });
    expect(emitted).toBeTrue();
    expect(closeSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('success', jasmine.any(String));
  });

  it('onSubmit con éxito (addPolicy="creator") envía allCanAddDocuments=false', () => {
    spyOn(groupService, 'createGroup').and.returnValue(of({ id: 1 } as any));
    const c = build();
    c.createForm.setValue({ name: 'G2', addPolicy: 'creator' });
    c.onSubmit();
    expect(groupService.createGroup).toHaveBeenCalledWith({ name: 'G2', allCanAddDocuments: false });
  });

  it('onSubmit con error usa mensaje del backend', () => {
    spyOn(groupService, 'createGroup').and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Mal' }, status: 400 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const c = build();
    c.createForm.setValue({ name: 'G', addPolicy: 'all' });
    c.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', 'Mal');
    expect(c.loading).toBeFalse();
  });

  it('onSubmit con error sin payload usa mensaje genérico', () => {
    spyOn(groupService, 'createGroup').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const c = build();
    c.createForm.setValue({ name: 'G', addPolicy: 'all' });
    c.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo crear/));
  });
});
