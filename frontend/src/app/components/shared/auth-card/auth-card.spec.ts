import { TestBed } from '@angular/core/testing';

import { AuthCardComponent } from './auth-card';
import { AuthModalService } from '../../../services/auth-modal.service';

describe('AuthCardComponent', () => {
  let modal: AuthModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthCardComponent],
    }).compileComponents();
    modal = TestBed.inject(AuthModalService);
  });

  function build() {
    const fx = TestBed.createComponent(AuthCardComponent);
    fx.componentRef.setInput('title', 'Login');
    fx.detectChanges();
    return { fx, comp: fx.componentInstance as any };
  }

  it('onEscape cierra el modal y emite closed', () => {
    const closeSpy = spyOn(modal, 'close');
    const { comp } = build();
    let emitted = false;
    comp.closed.subscribe(() => (emitted = true));
    comp.onEscape();
    expect(closeSpy).toHaveBeenCalled();
    expect(emitted).toBeTrue();
  });

  it('onBackdropClick cierra solo si el clic ocurre en el backdrop', () => {
    const closeSpy = spyOn(modal, 'close');
    const { comp } = build();
    const el = document.createElement('div');
    comp.onBackdropClick({ target: el, currentTarget: el } as any);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.calls.reset();
    comp.onBackdropClick({ target: document.createElement('span'), currentTarget: el } as any);
    expect(closeSpy).not.toHaveBeenCalled();
  });
});
