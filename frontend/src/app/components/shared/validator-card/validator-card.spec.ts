import { TestBed } from '@angular/core/testing';
import { ValidatorCardComponent } from './validator-card';

describe('ValidatorCardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ValidatorCardComponent] }).compileComponents();
  });

  function build() {
    const fx = TestBed.createComponent(ValidatorCardComponent);
    fx.detectChanges();
    return fx.componentInstance as any;
  }

  it('formattedDate vacía si no hay fecha seleccionada', () => {
    expect(build().formattedDate()).toBe('');
  });

  it('onDateChange actualiza la selección y formattedDate', () => {
    const c = build();
    c.onDateChange(new Date(2024, 0, 15));
    expect(c.selectedDate()).toBeTruthy();
    expect(c.formattedDate()).toContain('2024');
  });

  it('applyPreset selecciona una fecha y isPresetActive coincide', () => {
    const c = build();
    const preset = c.presets[0];
    c.applyPreset(preset);
    expect(c.selectedDate()).toBeTruthy();
    expect(c.isPresetActive(preset)).toBeTrue();
  });

  it('isPresetActive es false sin selección', () => {
    const c = build();
    expect(c.isPresetActive(c.presets[1])).toBeFalse();
  });

  it('isPresetActive false cuando la fecha no coincide', () => {
    const c = build();
    c.onDateChange(new Date(1990, 0, 1));
    expect(c.isPresetActive(c.presets[2])).toBeFalse();
  });

  it('onCheck no emite sin fecha', () => {
    const c = build();
    let emitted = false;
    c.check.subscribe(() => (emitted = true));
    c.onCheck();
    expect(emitted).toBeFalse();
  });

  it('onCheck emite la fecha seleccionada', () => {
    const c = build();
    const date = new Date(2024, 5, 1);
    c.onDateChange(date);
    let captured: unknown = null;
    c.check.subscribe((d: Date) => (captured = d));
    c.onCheck();
    expect(captured).toBe(date);
  });
});
