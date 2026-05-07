import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { JoinGroupModalComponent } from './join-group-modal';
import { GroupService } from '../../../services/group.service';
import { JoinGroupModalService } from '../../../services/join-group-modal.service';
import { AlertService } from '../../../services/alert.service';

describe('JoinGroupModalComponent', () => {
  let groupService: GroupService;
  let modal: JoinGroupModalService;
  let alert: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinGroupModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    groupService = TestBed.inject(GroupService);
    modal = TestBed.inject(JoinGroupModalService);
    alert = TestBed.inject(AlertService);
  });

  function build() {
    const fx = TestBed.createComponent(JoinGroupModalComponent);
    fx.detectChanges();
    return fx.componentInstance as any;
  }

  it('onModalClosed cierra el modal', () => {
    const spy = spyOn(modal, 'close');
    build().onModalClosed();
    expect(spy).toHaveBeenCalled();
  });

  it('onSubmit con form inválido no llama al servicio', () => {
    const spy = spyOn(groupService, 'joinGroup');
    build().onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onSubmit con éxito emite groupJoined', () => {
    spyOn(groupService, 'joinGroup').and.returnValue(of({ id: 1 } as any));
    const alertSpy = spyOn(alert, 'show');
    const closeSpy = spyOn(modal, 'close');
    const c = build();
    let emitted = false;
    c.groupJoined.subscribe(() => (emitted = true));
    c.joinForm.setValue({ accessCode: 'ABC123' });
    c.onSubmit();
    expect(emitted).toBeTrue();
    expect(closeSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('success', jasmine.any(String));
  });

  it('onSubmit con error muestra mensaje del backend', () => {
    spyOn(groupService, 'joinGroup').and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Bad code' }, status: 400 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const c = build();
    c.joinForm.setValue({ accessCode: 'ABC' });
    c.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', 'Bad code');
    expect(c.loading).toBeFalse();
  });

  it('onSubmit con error sin payload usa mensaje genérico', () => {
    spyOn(groupService, 'joinGroup').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const c = build();
    c.joinForm.setValue({ accessCode: 'ABC' });
    c.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo unir/));
  });
});
