import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { UploadDocumentModalComponent } from './upload-document-modal';
import { DocumentService } from '../../../services/document.service';
import { UploadDocumentModalService } from '../../../services/upload-document-modal.service';
import { AlertService } from '../../../services/alert.service';

describe('UploadDocumentModalComponent', () => {
  let docService: DocumentService;
  let modalService: UploadDocumentModalService;
  let alert: AlertService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadDocumentModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    docService = TestBed.inject(DocumentService);
    modalService = TestBed.inject(UploadDocumentModalService);
    alert = TestBed.inject(AlertService);
  });

  function build() {
    const fx = TestBed.createComponent(UploadDocumentModalComponent);
    fx.detectChanges();
    return { fx, comp: fx.componentInstance as any };
  }

  it('selectMethod("manual") lleva al paso type-select', () => {
    const { comp } = build();
    comp.selectMethod('manual');
    expect(comp.currentStep()).toBe('type-select');
    expect(comp.selectedMethod()).toBe('manual');
  });

  it('selectMethod("image") lleva al paso image-upload', () => {
    const { comp } = build();
    comp.selectMethod('image');
    expect(comp.currentStep()).toBe('image-upload');
  });

  it('flujo ticket: type → ticket-category → form', () => {
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('ticket');
    comp.onTypeNext();
    expect(comp.currentStep()).toBe('ticket-category');
    comp.selectTicketCategory('Devolución');
    comp.onTicketCategoryNext();
    expect(comp.currentStep()).toBe('form');
  });

  it('flujo documento: type → category-select → form', () => {
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('document');
    comp.onTypeNext();
    expect(comp.currentStep()).toBe('category-select');
    comp.selectCategory('DNI');
    comp.onCategoryNext();
    expect(comp.currentStep()).toBe('form');
  });

  it('onCategoryNext con OTHER sin texto no avanza', () => {
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('document');
    comp.onTypeNext();
    comp.selectCategory('OTHER');
    comp.onCategoryNext();
    expect(comp.currentStep()).toBe('category-select');
    comp.customCategory.set('Custom');
    comp.onCategoryNext();
    expect(comp.currentStep()).toBe('form');
  });

  it('onTicketCategoryNext con OTHER sin texto no avanza', () => {
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('ticket');
    comp.onTypeNext();
    comp.selectTicketCategory('OTHER');
    comp.onTicketCategoryNext();
    expect(comp.currentStep()).toBe('ticket-category');
    comp.customTicketCategory.set('Custom');
    comp.onTicketCategoryNext();
    expect(comp.currentStep()).toBe('form');
  });

  it('onTypeNext sin tipo no hace nada', () => {
    const { comp } = build();
    comp.selectMethod('manual');
    comp.onTypeNext();
    expect(comp.currentStep()).toBe('type-select');
  });

  it('goBack desde cada paso vuelve al anterior', () => {
    const { comp } = build();
    comp.selectMethod('image');
    comp.goBack();
    expect(comp.currentStep()).toBe('method');

    comp.selectMethod('manual');
    comp.goBack();
    expect(comp.currentStep()).toBe('method');

    comp.selectMethod('manual');
    comp.selectType('ticket');
    comp.onTypeNext();
    comp.goBack();
    expect(comp.currentStep()).toBe('type-select');

    comp.selectType('document');
    comp.onTypeNext();
    comp.goBack();
    expect(comp.currentStep()).toBe('type-select');

    comp.selectType('ticket');
    comp.onTypeNext();
    comp.selectTicketCategory('Devolución');
    comp.onTicketCategoryNext();
    comp.goBack();
    expect(comp.currentStep()).toBe('ticket-category');

    comp.selectType('document');
    comp.onTypeNext();
    comp.selectCategory('DNI');
    comp.onCategoryNext();
    comp.goBack();
    expect(comp.currentStep()).toBe('category-select');
  });

  it('onImageSelected guarda el archivo', () => {
    const { comp } = build();
    const file = new File(['x'], 'a.png');
    comp.onImageSelected(file);
    expect(comp.imageFile()).toBe(file);
  });

  it('extractData sin archivo no llama al servicio', () => {
    const spy = spyOn(docService, 'previewFromImage');
    const { comp } = build();
    comp.extractData();
    expect(spy).not.toHaveBeenCalled();
  });

  it('extractData con éxito aplica preview y navega al paso form', () => {
    spyOn(docService, 'previewFromImage').and.returnValue(
      of({
        type: 'RECEIPT',
        kind: 'ticket',
        title: 'Compra',
        category: 'Garantía',
        storeName: 'MediaMarkt',
        amount: 100,
        issueDate: '2025-01-01',
        expiryDate: '2027-01-01',
        aiProcessed: true,
      } as any),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.extractData();
    expect(comp.currentStep()).toBe('form');
    expect(comp.selectedKind()).toBe('ticket');
    expect(comp.selectedTicketCategory()).toBe('Garantía');
    expect(comp.aiPreviewApplied()).toBeTrue();
    expect(alertSpy).toHaveBeenCalledWith('success', jasmine.any(String));
    expect(comp.loading()).toBeFalse();
  });

  it('extractData mientras loading no llama al servicio', () => {
    const spy = spyOn(docService, 'previewFromImage');
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.loading.set(true);
    comp.extractData();
    expect(spy).not.toHaveBeenCalled();
  });

  it('extractData con preview de documento categoría OTHER usa custom', () => {
    spyOn(docService, 'previewFromImage').and.returnValue(
      of({
        type: 'OTHER',
        kind: 'document',
        title: 'Doc',
        category: 'MiCategoriaLargaQueSeTrunca',
        storeName: null,
        amount: null,
        issueDate: null,
        expiryDate: null,
        aiProcessed: false,
      } as any),
    );
    spyOn(alert, 'show');
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.extractData();
    expect(comp.selectedKind()).toBe('document');
    expect(comp.selectedCategory()).toBe('OTHER');
    expect(comp.customCategory().length).toBeLessThanOrEqual(12);
    expect(comp.aiPreviewApplied()).toBeFalse();
  });

  it('extractData con preview de documento categoría conocida', () => {
    spyOn(docService, 'previewFromImage').and.returnValue(
      of({
        type: 'DNI',
        kind: 'document',
        title: 'Mi DNI',
        category: 'DNI',
        storeName: null,
        amount: null,
        issueDate: null,
        expiryDate: null,
        aiProcessed: false,
      } as any),
    );
    spyOn(alert, 'show');
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.extractData();
    expect(comp.selectedCategory()).toBe('DNI');
    expect(comp.customCategory()).toBe('');
  });

  it('extractData con preview de ticket categoría OTHER usa custom', () => {
    spyOn(docService, 'previewFromImage').and.returnValue(
      of({
        type: 'OTHER',
        kind: 'ticket',
        title: 'T',
        category: 'OtraCosaMuyLarga',
        storeName: null,
        amount: null,
        issueDate: null,
        expiryDate: null,
        aiProcessed: false,
      } as any),
    );
    spyOn(alert, 'show');
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.extractData();
    expect(comp.selectedTicketCategory()).toBe('OTHER');
    expect(comp.customTicketCategory().length).toBeLessThanOrEqual(12);
  });

  it('extractData con error muestra alerta', () => {
    spyOn(docService, 'previewFromImage').and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Bad' }, status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.extractData();
    expect(alertSpy).toHaveBeenCalledWith('error', 'Bad');
    expect(comp.loading()).toBeFalse();
  });

  it('onSubmit con éxito crea documento y cierra modal', () => {
    spyOn(docService, 'createDocument').and.returnValue(of({ id: 1 } as any));
    const alertSpy = spyOn(alert, 'show');
    const closeSpy = spyOn(modalService, 'close');
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('document');
    comp.onTypeNext();
    comp.selectCategory('DNI');
    comp.onCategoryNext();
    comp.docForm.setValue({ title: 'X', storeName: '', issueDate: '', expiryDate: '' });
    let emitted = false;
    comp.documentCreated.subscribe(() => (emitted = true));
    comp.onSubmit();
    expect(emitted).toBeTrue();
    expect(alertSpy).toHaveBeenCalledWith('success', jasmine.any(String));
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onSubmit con error muestra alerta y rebaja loading', () => {
    spyOn(docService, 'createDocument').and.returnValue(
      throwError(() => new HttpErrorResponse({ error: { error: 'Nope' }, status: 400 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('ticket');
    comp.onTypeNext();
    comp.selectTicketCategory('Garantía');
    comp.onTicketCategoryNext();
    comp.docForm.setValue({ title: 'X', storeName: '', issueDate: '', expiryDate: '' });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', 'Nope');
    expect(comp.loading()).toBeFalse();
  });

  it('onSubmit con formulario inválido no llama al servicio', () => {
    const spy = spyOn(docService, 'createDocument');
    const { comp } = build();
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('resolveDocumentType con ticket "Devolución" devuelve RECEIPT', () => {
    const { comp } = build();
    comp.selectedKind.set('ticket');
    comp.selectedTicketCategory.set('Devolución');
    expect(comp['resolveDocumentType']()).toBe('RECEIPT');
    comp.selectedTicketCategory.set('Garantía');
    expect(comp['resolveDocumentType']()).toBe('WARRANTY');
    comp.selectedTicketCategory.set('OTHER');
    expect(comp['resolveDocumentType']()).toBe('OTHER');
  });

  it('resolveDocumentType para document mapea por categoría', () => {
    const { comp } = build();
    comp.selectedKind.set('document');
    comp.selectedCategory.set('DNI');
    expect(comp['resolveDocumentType']()).toBe('DNI');
    comp.selectedCategory.set('Pasaporte');
    expect(comp['resolveDocumentType']()).toBe('PASSPORT');
    comp.selectedCategory.set('Carnet de conducir');
    expect(comp['resolveDocumentType']()).toBe('DRIVING_LICENSE');
    comp.selectedCategory.set('OTHER');
    expect(comp['resolveDocumentType']()).toBe('OTHER');
  });

  it('onEscape cierra el modal', () => {
    const closeSpy = spyOn(modalService, 'close');
    const { comp } = build();
    comp.onEscape();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('onBackdropClick sólo cierra cuando el target es el backdrop', () => {
    const closeSpy = spyOn(modalService, 'close');
    const { comp } = build();
    const el = document.createElement('div');
    comp.onBackdropClick({ target: el, currentTarget: el } as any);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    closeSpy.calls.reset();
    const child = document.createElement('span');
    comp.onBackdropClick({ target: child, currentTarget: el } as any);
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('extractData error sin payload usa mensaje genérico', () => {
    spyOn(docService, 'previewFromImage').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.extractData();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo extraer/));
  });

  it('onEscape con lightbox abierto solo cierra el lightbox', () => {
    const closeSpy = spyOn(modalService, 'close');
    const { comp } = build();
    comp.lightboxOpen.set(true);
    comp.onEscape();
    expect(comp.lightboxOpen()).toBeFalse();
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('openLightbox sin imagen no abre', () => {
    const { comp } = build();
    comp.openLightbox();
    expect(comp.lightboxOpen()).toBeFalse();
  });

  it('openLightbox con imagen abre y closeLightbox cierra', () => {
    const { comp } = build();
    comp.imageFile.set(new File(['x'], 'a.png'));
    comp.imagePreviewUrl.set('blob:fake');
    comp.openLightbox();
    expect(comp.lightboxOpen()).toBeTrue();
    comp.closeLightbox();
    expect(comp.lightboxOpen()).toBeFalse();
  });

  it('goBack desde form en flujo image vuelve a image-upload', () => {
    const { comp } = build();
    comp.selectedMethod.set('image');
    comp.currentStep.set('form');
    comp.goBack();
    expect(comp.currentStep()).toBe('image-upload');
  });

  it('onSubmit envía creationMethod OCR cuando viene de imagen sin IA', () => {
    const createSpy = spyOn(docService, 'createDocument').and.returnValue(of({ id: 1 } as any));
    spyOn(alert, 'show');
    spyOn(modalService, 'close');
    const { comp } = build();
    comp.selectedMethod.set('image');
    comp.selectedKind.set('document');
    comp.selectedCategory.set('DNI');
    comp.currentStep.set('form');
    comp.aiPreviewApplied.set(false);
    comp.docForm.setValue({ title: 'X', storeName: '', issueDate: '', expiryDate: '' });
    comp.onSubmit();
    const body = createSpy.calls.mostRecent().args[0] as any;
    expect(body.creationMethod).toBe('OCR');
    expect(body.aiProcessed).toBeFalse();
  });

  it('onSubmit envía creationMethod AI cuando viene de imagen con IA', () => {
    const createSpy = spyOn(docService, 'createDocument').and.returnValue(of({ id: 1 } as any));
    spyOn(alert, 'show');
    spyOn(modalService, 'close');
    const { comp } = build();
    comp.selectedMethod.set('image');
    comp.selectedKind.set('document');
    comp.selectedCategory.set('DNI');
    comp.currentStep.set('form');
    comp.aiPreviewApplied.set(true);
    comp.docForm.setValue({ title: 'X', storeName: '', issueDate: '', expiryDate: '' });
    comp.onSubmit();
    const body = createSpy.calls.mostRecent().args[0] as any;
    expect(body.creationMethod).toBe('AI');
    expect(body.aiProcessed).toBeTrue();
  });

  it('onSubmit envía creationMethod MANUAL en flujo manual', () => {
    const createSpy = spyOn(docService, 'createDocument').and.returnValue(of({ id: 1 } as any));
    spyOn(alert, 'show');
    spyOn(modalService, 'close');
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('document');
    comp.onTypeNext();
    comp.selectCategory('DNI');
    comp.onCategoryNext();
    comp.docForm.setValue({ title: 'X', storeName: '', issueDate: '', expiryDate: '' });
    comp.onSubmit();
    const body = createSpy.calls.mostRecent().args[0] as any;
    expect(body.creationMethod).toBe('MANUAL');
  });

  it('onSubmit mientras loading no llama al servicio', () => {
    const spy = spyOn(docService, 'createDocument');
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('document');
    comp.onTypeNext();
    comp.selectCategory('DNI');
    comp.onCategoryNext();
    comp.docForm.setValue({ title: 'X', storeName: '', issueDate: '', expiryDate: '' });
    comp.loading.set(true);
    comp.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('onSubmit error sin payload usa mensaje genérico', () => {
    spyOn(docService, 'createDocument').and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    const alertSpy = spyOn(alert, 'show');
    const { comp } = build();
    comp.selectMethod('manual');
    comp.selectType('document');
    comp.onTypeNext();
    comp.selectCategory('DNI');
    comp.onCategoryNext();
    comp.docForm.setValue({ title: 'X', storeName: '', issueDate: '', expiryDate: '' });
    comp.onSubmit();
    expect(alertSpy).toHaveBeenCalledWith('error', jasmine.stringMatching(/No se pudo crear/));
  });

  it('resolveCategory devuelve customCategory cuando OTHER', () => {
    const { comp } = build();
    comp.selectedKind.set('document');
    comp.selectedCategory.set('OTHER');
    comp.customCategory.set('Mi cat');
    expect(comp['resolveCategory']()).toBe('Mi cat');
    comp.customCategory.set('   ');
    expect(comp['resolveCategory']()).toBeNull();
    comp.selectedKind.set('ticket');
    comp.selectedTicketCategory.set('OTHER');
    comp.customTicketCategory.set('TC');
    expect(comp['resolveCategory']()).toBe('TC');
    comp.customTicketCategory.set('');
    expect(comp['resolveCategory']()).toBeNull();
  });
});
