import { TestBed } from '@angular/core/testing';
import { DeleteGroupCardComponent } from './delete-group-card';

describe('DeleteGroupCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DeleteGroupCardComponent] }).compileComponents();
  });

  function build() {
    const fx = TestBed.createComponent(DeleteGroupCardComponent);
    fx.detectChanges();
    return fx.componentInstance as any;
  }

  it('openConfirm muestra el modal', () => {
    const c = build();
    c.openConfirm();
    expect(c.showConfirm).toBeTrue();
  });

  it('onConfirm oculta y emite', () => {
    const c = build();
    let e = false;
    c.deleteConfirmed.subscribe(() => (e = true));
    c.onConfirm();
    expect(e).toBeTrue();
    expect(c.showConfirm).toBeFalse();
  });

  it('onCancel cierra sin emitir', () => {
    const c = build();
    c.openConfirm();
    let e = false;
    c.deleteConfirmed.subscribe(() => (e = true));
    c.onCancel();
    expect(c.showConfirm).toBeFalse();
    expect(e).toBeFalse();
  });
});
