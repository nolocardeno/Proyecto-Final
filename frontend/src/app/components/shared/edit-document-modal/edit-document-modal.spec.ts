import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { EditDocumentModalComponent } from './edit-document-modal';
import { DocumentService } from '../../../services/document.service';
import { AlertService } from '../../../services/alert.service';

const baseDoc: any = {
  id: 1,
  type: 'DNI',
  title: 'Mi DNI',
  category: 'DNI',
  storeName: null,
  amount: null,
  issueDate: '2024-01-01',
  expiryDate: '2025-01-01',
  daysRemaining: 30,
  imagePath: null,
  aiProcessed: false,
  notes: null,
  status: 'ACTIVE',
  duplicateOfId: null,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('EditDocumentModalComponent', () => {
  let docService: DocumentService;
  let alert: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditDocumentModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    docService = TestBed.inject(DocumentService);
    alert = TestBed.inject(AlertService);
  });

  function build(doc = baseDoc) {
    const fx = TestBed.createComponent(EditDocumentModalComponent);
    fx.componentRef.setInput('document', doc);
    fx.detectChanges();
    return { fx, comp: fx.componentInstance as any };
  }

  it('inicializa formulario y kind/categoría desde el documento', () => {
    const { comp } = build();
    expect(comp.editForm.value.title).toBe('Mi DNI');
    expect(comp.selectedKind()).toBe('document');
    expect(comp.selectedCategory()).toBe('DNI');
  });

  it('inicializa con tipo ticket cuando el documento es RECEIPT', () => {
    const { comp } = build({ ...baseDoc, type: 'RECEIPT', category: 'Devolución' });
    expect(comp.selectedKind()).toBe('ticket');
    expect(comp.selectedCategory()).toBe('Devolución');
  });

  it('cuando la categoría no está en presets usa "Otro" + custom', () => {
    const { comp } = build({ ...baseDoc, type: 'OTHER', category: 'CategoríaCustom' });
    expect(comp.selectedCategory()).toBe('Otro');
    expect(comp.customCategory()).toBe('CategoríaCustom');
  });

  it('onKindChange resetea categoría', () => {
    const { comp } = build();
    comp.onKindChange('ticket');
    expect(comp.selectedKind()).toBe('ticket');
    expect(comp.selectedCategory()).toBeNull();
  });

  it('onCategoryChange con valor distinto de "Otro" limpia custom', () => {
    const { comp } = build({ ...baseDoc, type: 'OTHER', category: 'X' });
    comp.onCategoryChange('Pasaporte');
    expect(comp.selectedCategory()).toBe('Pasaporte');
    expect(comp.customCategory()).toBe('');
  });

  it('onCategoryChange con cadena vacía deselecciona', () => {
    const { comp } = build();
    comp.onCategoryChange('');
    expect(comp.selectedCategory()).toBeNull();
  });

  it('onSubmit con formulario válido llama updateDocument y emite saved', () => {
    spyOn(docService, 'updateDocument').and.returnValue(of({ ...baseDoc, title: 'Nuevo' } as any));
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    let saved = false;
    comp.saved.subscribe(() => (saved = true));
    comp.editForm.patchValue({ title: 'Nuevo' });
    comp.onSubmit();
    expect(saved).toBeTrue();
    expect(alertSpy).toHaveBeenCalledWith('success', jasmine.any(String));
  });

  it('onSubmit con error muestra alerta', () => {
    spyOn(docService, 'updateDocument').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo actualizar/));
  });

  it('onSubmit no envía si el formulario es inválido', () => {
    const spy = spyOn(docService, 'updateDocument');
    const { comp } = build();
    comp.editForm.patchValue({ title: '' });
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onSubmit no envía si la categoría es "Otro" sin texto', () => {
    const spy = spyOn(docService, 'updateDocument');
    const { comp } = build();
    comp.selectedCategory.set('Otro');
    comp.customCategory.set('');
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onEscape emite cancelled', () => {
    const { comp } = build();
    let cancelled = false;
    comp.cancelled.subscribe(() => (cancelled = true));
    comp.onEscape();
    expect(cancelled).toBeTrue();
  });

  it('onBackdropClick emite cancelled solo cuando target == currentTarget', () => {
    const { comp } = build();
    let count = 0;
    comp.cancelled.subscribe(() => count++);
    const el = document.createElement('div');
    comp.onBackdropClick({ target: el, currentTarget: el } as any);
    comp.onBackdropClick({ target: document.createElement('span'), currentTarget: el } as any);
    expect(count).toBe(1);
  });

  it('resolveDocumentType cubre ramas de ticket y document', () => {
    const { comp } = build();
    comp.selectedKind.set('ticket');
    comp.selectedCategory.set('Devolución');
    expect(comp['resolveDocumentType']()).toBe('RECEIPT');
    comp.selectedCategory.set('Garantía');
    expect(comp['resolveDocumentType']()).toBe('WARRANTY');
    comp.selectedCategory.set('Otro');
    expect(comp['resolveDocumentType']()).toBe('OTHER');
    comp.selectedKind.set('document');
    comp.selectedCategory.set('Pasaporte');
    expect(comp['resolveDocumentType']()).toBe('PASSPORT');
    comp.selectedCategory.set('Carnet de conducir');
    expect(comp['resolveDocumentType']()).toBe('DRIVING_LICENSE');
  });
});
