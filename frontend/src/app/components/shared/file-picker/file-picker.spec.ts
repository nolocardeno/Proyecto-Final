import { TestBed } from '@angular/core/testing';

import { FilePickerComponent } from './file-picker';
import { AlertService } from '../../../services/alert.service';

describe('FilePickerComponent', () => {
  let alert: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilePickerComponent],
    }).compileComponents();
    alert = TestBed.inject(AlertService);
  });

  function build() {
    const fx = TestBed.createComponent(FilePickerComponent);
    fx.detectChanges();
    return { fx, comp: fx.componentInstance as any };
  }

  function fakeEvent(file: File | null): Event {
    const input = document.createElement('input');
    input.type = 'file';
    Object.defineProperty(input, 'files', {
      value: file ? [file] : [],
      configurable: true,
    });
    return { target: input, currentTarget: input } as unknown as Event;
  }

  it('no hace nada si no hay archivo', () => {
    const spy = spyOn(alert, 'show');
    const { comp } = build();
    let emitted: unknown = null;
    comp.fileSelected.subscribe((f: File) => (emitted = f));
    comp.onFileChange(fakeEvent(null));
    expect(spy).not.toHaveBeenCalled();
    expect(emitted).toBeNull();
  });

  it('emite el archivo cuando es válido', () => {
    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    const { comp } = build();
    let emitted: unknown = null;
    comp.fileSelected.subscribe((f: File) => (emitted = f));
    comp.onFileChange(fakeEvent(file));
    expect(emitted).toBe(file);
    expect(comp.fileName()).toBe('foto.png');
  });

  it('rechaza archivos con extensión no soportada', () => {
    const spy = spyOn(alert, 'show');
    const file = new File(['x'], 'doc.pdf', { type: 'application/pdf' });
    const { comp } = build();
    comp.onFileChange(fakeEvent(file));
    expect(spy).toHaveBeenCalledWith('error', jasmine.stringMatching(/Formato/));
  });

  it('rechaza archivos demasiado grandes', () => {
    const spy = spyOn(alert, 'show');
    const big = new File([new ArrayBuffer(11 * 1024 * 1024)], 'foto.png');
    const { comp } = build();
    comp.onFileChange(fakeEvent(big));
    expect(spy).toHaveBeenCalledWith('error', jasmine.stringMatching(/tamaño máximo/));
  });
});
