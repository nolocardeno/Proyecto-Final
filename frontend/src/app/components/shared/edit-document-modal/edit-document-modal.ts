// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, HostListener, inject, input, output, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonComponent } from '../button/button';
import { FormFieldComponent } from '../form-field/form-field';
import { FilePickerComponent } from '../file-picker/file-picker';
import { DocumentService } from '../../../services/document.service';
import { AlertService } from '../../../services/alert.service';
import { PageTitleService } from '../../../services/page-title.service';
import { type DocumentResponse, type DocumentType } from '../../../models/document.model';

// --------------------------------------------------------------------------
// TIPOS INTERNOS
// --------------------------------------------------------------------------
type DocKind = 'ticket' | 'document';

const TICKET_CATEGORIES = ['Devolución', 'Garantía', 'Otro'];
const DOCUMENT_CATEGORIES = ['DNI', 'Pasaporte', 'Carnet de conducir', 'Otro'];

const KIND_MAP: Record<DocumentType, DocKind> = {
  RECEIPT: 'ticket',
  WARRANTY: 'ticket',
  INVOICE: 'ticket',
  DNI: 'document',
  PASSPORT: 'document',
  DRIVING_LICENSE: 'document',
  INSURANCE: 'document',
  ITV: 'document',
  OTHER: 'document',
};

// --------------------------------------------------------------------------
// COMPONENTE: EDIT DOCUMENT MODAL
// --------------------------------------------------------------------------

/**
 * Modal de edición de un documento ya existente. Reconstruye el tipo
 * y la categoría a partir del documento de entrada usando los mapas
 * `KIND_MAP` y, mediante Reactive Forms con validadores, permite
 * actualizar título, fechas y opcionalmente la imagen asociada.
 */
@Component({
  selector: 'app-edit-document-modal',
  imports: [ReactiveFormsModule, ButtonComponent, FormFieldComponent, FilePickerComponent],
  templateUrl: './edit-document-modal.html',
  styleUrl: './edit-document-modal.scss',
})
export class EditDocumentModalComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly documentService = inject(DocumentService);
  private readonly alertService = inject(AlertService);
  private readonly pageTitle = inject(PageTitleService);

  document = input.required<DocumentResponse>();
  saved = output<DocumentResponse>();
  cancelled = output<void>();

  protected readonly loading = signal(false);
  protected readonly imageFile = signal<File | null>(null);

  protected readonly selectedKind = signal<DocKind | null>(null);
  protected readonly selectedCategory = signal<string | null>(null);
  protected readonly customCategory = signal('');

  protected readonly categoryOptions = computed(() =>
    this.selectedKind() === 'ticket' ? TICKET_CATEGORIES : DOCUMENT_CATEGORIES
  );
  protected readonly showCustomInput = computed(() => this.selectedCategory() === 'Otro');

  protected readonly editForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(25)]],
    storeName: [''],
    issueDate: [''],
    expiryDate: [''],
  });

  ngOnInit(): void {
    this.pageTitle.setModalTitle('Editar documento');
    const doc = this.document();

    // Derive kind from DocumentType
    const kind: DocKind = KIND_MAP[doc.type as DocumentType] ?? 'document';
    this.selectedKind.set(kind);

    // Derive selected category preset (or 'Otro' + custom text)
    const presets = kind === 'ticket' ? TICKET_CATEGORIES : DOCUMENT_CATEGORIES;
    const docCategory = doc.category ?? null;
    if (docCategory && presets.slice(0, -1).includes(docCategory)) {
      this.selectedCategory.set(docCategory);
    } else if (docCategory) {
      this.selectedCategory.set('Otro');
      this.customCategory.set(docCategory);
    }

    this.editForm.patchValue({
      title: doc.title,
      storeName: doc.storeName ?? '',
      issueDate: doc.issueDate ?? '',
      expiryDate: doc.expiryDate ?? '',
    });
  }

  ngOnDestroy(): void {
    this.pageTitle.restoreRouteTitle();
  }

  protected onKindChange(kind: string): void {
    this.selectedKind.set(kind as DocKind);
    this.selectedCategory.set(null);
    this.customCategory.set('');
  }

  protected onCategoryChange(cat: string): void {
    this.selectedCategory.set(cat || null);
    if (cat !== 'Otro') this.customCategory.set('');
  }

  // --------------------------------------------------------------------------
  // KEYBOARD: Escape cierra el modal
  // --------------------------------------------------------------------------
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cancelled.emit();
  }

  // --------------------------------------------------------------------------
  // BACKDROP CLICK
  // --------------------------------------------------------------------------
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancelled.emit();
    }
  }

  // --------------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------------
  private resolveDocumentType(): DocumentType {
    const kind = this.selectedKind();
    const cat = this.selectedCategory();
    if (kind === 'ticket') {
      if (cat === 'Devolución') return 'RECEIPT';
      if (cat === 'Garantía') return 'WARRANTY';
      return 'RECEIPT';
    }
    const map: Partial<Record<string, DocumentType>> = {
      DNI: 'DNI',
      Pasaporte: 'PASSPORT',
      'Carnet de conducir': 'DRIVING_LICENSE',
    };
    return (cat && map[cat]) ? map[cat]! : 'OTHER';
  }

  private resolveCategory(): string | null {
    const cat = this.selectedCategory();
    if (cat === 'Otro') return this.customCategory().trim() || null;
    return cat;
  }

  // --------------------------------------------------------------------------
  // SUBMIT
  // --------------------------------------------------------------------------
  protected onSubmit(): void {
    if (this.editForm.invalid || this.loading()) return;
    if (!this.selectedKind() || !this.selectedCategory()) return;
    if (this.showCustomInput() && !this.customCategory().trim()) return;

    const raw = this.editForm.getRawValue();
    const body: Record<string, unknown> = {
      title: raw.title,
      storeName: raw.storeName || null,
      type: this.resolveDocumentType(),
      kind: this.selectedKind(),
      category: this.resolveCategory(),
      issueDate: raw.issueDate || null,
      expiryDate: raw.expiryDate || null,
    };

    this.loading.set(true);
    this.documentService.updateDocument(this.document().id, body, this.imageFile()).subscribe({
      next: (updated: DocumentResponse) => {
        this.loading.set(false);
        this.alertService.show('success', 'Documento actualizado correctamente');
        this.saved.emit(updated);
      },
      error: () => {
        this.loading.set(false);
        this.alertService.show('error', 'No se pudo actualizar el documento');
      },
    });
  }
}
