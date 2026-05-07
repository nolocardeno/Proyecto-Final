import { TestBed } from '@angular/core/testing';
import { DeleteDocumentCardComponent } from './delete-document-card';

describe('DeleteDocumentCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DeleteDocumentCardComponent] }).compileComponents();
  });

  function build() {
    const fx = TestBed.createComponent(DeleteDocumentCardComponent);
    fx.detectChanges();
    return fx.componentInstance as any;
  }

  it('openConfirm muestra el modal', () => {
    const c = build();
    c.openConfirm();
    expect(c.showConfirm).toBeTrue();
  });

  it('onConfirm oculta el modal y emite', () => {
    const c = build();
    c.openConfirm();
    let emitted = false;
    c.deleteConfirmed.subscribe(() => (emitted = true));
    c.onConfirm();
    expect(emitted).toBeTrue();
    expect(c.showConfirm).toBeFalse();
  });

  it('onCancel cierra sin emitir', () => {
    const c = build();
    c.openConfirm();
    let emitted = false;
    c.deleteConfirmed.subscribe(() => (emitted = true));
    c.onCancel();
    expect(c.showConfirm).toBeFalse();
    expect(emitted).toBeFalse();
  });
});
