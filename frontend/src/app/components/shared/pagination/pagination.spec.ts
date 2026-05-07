import { TestBed } from '@angular/core/testing';

import { PaginationComponent } from './pagination';

describe('PaginationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginationComponent] }).compileComponents();
  });

  function build(totalItems: number, currentPage = 1, pageSize = 9) {
    const fx = TestBed.createComponent(PaginationComponent);
    fx.componentRef.setInput('totalItems', totalItems);
    fx.componentRef.setInput('pageSize', pageSize);
    fx.componentRef.setInput('currentPage', currentPage);
    fx.detectChanges();
    return { fx, comp: fx.componentInstance as any };
  }

  it('calcula totalPages correctamente', () => {
    const { comp } = build(50, 1, 10);
    expect(comp.totalPages()).toBe(5);
  });

  it('cuando hay pocas páginas devuelve la lista completa', () => {
    const { comp } = build(20, 1, 9);
    expect(comp.pages()).toEqual([1, 2, 3]);
  });

  it('inserta elipsis cuando hay muchas páginas', () => {
    const { comp } = build(200, 5, 9);
    const items = comp.pages();
    expect(items[0]).toBe(1);
    expect(items[items.length - 1]).toBe(Math.ceil(200 / 9));
    expect(items).toContain('…');
  });

  it('next() y prev() navegan entre páginas', () => {
    const { comp } = build(100, 2, 10);
    comp.next();
    expect(comp.currentPage()).toBe(3);
    comp.prev();
    expect(comp.currentPage()).toBe(2);
  });

  it('goTo() con página fuera de rango se acota', () => {
    const { comp } = build(100, 2, 10);
    comp.goTo(99);
    expect(comp.currentPage()).toBe(10);
    comp.goTo(-5);
    expect(comp.currentPage()).toBe(1);
  });

  it('goTo() a la misma página no cambia nada', () => {
    const { comp, fx } = build(100, 2, 10);
    comp.goTo(2);
    expect(comp.currentPage()).toBe(2);
    fx.destroy();
  });

  it('isPage() distingue número de elipsis', () => {
    const { comp } = build(10, 1);
    expect(comp.isPage(3)).toBeTrue();
    expect(comp.isPage('…')).toBeFalse();
  });
});
