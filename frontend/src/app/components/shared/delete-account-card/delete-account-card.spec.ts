import { TestBed } from '@angular/core/testing';

import { DeleteAccountCardComponent } from './delete-account-card';

describe('DeleteAccountCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteAccountCardComponent],
    }).compileComponents();
  });

  function build() {
    const fx = TestBed.createComponent(DeleteAccountCardComponent);
    fx.detectChanges();
    return { fx, comp: fx.componentInstance as any };
  }

  it('openConfirm muestra el modal', () => {
    const { comp } = build();
    comp.openConfirm();
    expect(comp.showConfirm).toBeTrue();
  });

  it('onConfirm oculta el modal y emite deleteConfirmed', () => {
    const { comp } = build();
    comp.openConfirm();
    let emitted = false;
    comp.deleteConfirmed.subscribe(() => (emitted = true));
    comp.onConfirm();
    expect(emitted).toBeTrue();
    expect(comp.showConfirm).toBeFalse();
  });

  it('onCancel cierra el modal sin emitir', () => {
    const { comp } = build();
    comp.openConfirm();
    let emitted = false;
    comp.deleteConfirmed.subscribe(() => (emitted = true));
    comp.onCancel();
    expect(comp.showConfirm).toBeFalse();
    expect(emitted).toBeFalse();
  });
});
