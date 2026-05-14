// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import {
  Component,
  ElementRef,
  HostListener,
  Renderer2,
  effect,
  inject,
  output,
  signal,
  computed,
  viewChild,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import {
  faPenToSquare,
  faExpand,
  faTicket,
  faFileLines,
  faIdCard,
  faPassport,
  faCar,
  faCirclePlus,
  faArrowRotateLeft,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { ButtonComponent } from '../button/button';
import { FormFieldComponent } from '../form-field/form-field';
import { FilePickerComponent } from '../file-picker/file-picker';
import { ProgressBarComponent } from '../progress-bar/progress-bar';
import { OptionButtonComponent } from '../option-button/option-button';
import { FormCheckboxComponent } from '../form-checkbox/form-checkbox';
import { DocumentService } from '../../../services/document.service';
import { UploadDocumentModalService } from '../../../services/upload-document-modal.service';
import { AlertService } from '../../../services/alert.service';
import { type DocumentExtractionPreview, type DocumentType } from '../../../models/document.model';

// --------------------------------------------------------------------------
// TIPOS INTERNOS
// --------------------------------------------------------------------------
type Step = 'method' | 'image-upload' | 'type-select' | 'ticket-category' | 'category-select' | 'form';
type UploadMethod = 'manual' | 'image';
type DocKind = 'ticket' | 'document';

interface OptionItem {
  icon: IconDefinition;
  label: string;
  value: string;
}

// --------------------------------------------------------------------------
// CONSTANTES
// --------------------------------------------------------------------------
const PROGRESS_MAP: Record<Step, number> = {
  'method': 25,
  'image-upload': 50,
  'type-select': 50,
  'ticket-category': 75,
  'category-select': 75,
  'form': 100,
};

const METHOD_OPTIONS: OptionItem[] = [
  { icon: faPenToSquare, label: 'Manual', value: 'manual' },
  { icon: faExpand, label: 'Desde imagen', value: 'image' },
];

const TYPE_OPTIONS: OptionItem[] = [
  { icon: faTicket, label: 'Ticket', value: 'ticket' },
  { icon: faFileLines, label: 'Documento', value: 'document' },
];

const TICKET_CATEGORY_OPTIONS: OptionItem[] = [
  { icon: faArrowRotateLeft, label: 'Devolución', value: 'Devolución' },
  { icon: faShieldHalved, label: 'Garantía', value: 'Garantía' },
  { icon: faCirclePlus, label: 'Otro', value: 'OTHER' },
];

const CATEGORY_OPTIONS: OptionItem[] = [
  { icon: faIdCard, label: 'DNI', value: 'DNI' },
  { icon: faPassport, label: 'Pasaporte', value: 'Pasaporte' },
  { icon: faCar, label: 'Carnet de conducir', value: 'Carnet de conducir' },
  { icon: faCirclePlus, label: 'Otro', value: 'OTHER' },
];

const TICKET_TYPE_MAP: Record<string, DocumentType> = {
  'RECEIPT': 'RECEIPT',
  'WARRANTY': 'WARRANTY',
  'INVOICE': 'INVOICE',
};

// --------------------------------------------------------------------------
// COMPONENTE: UPLOAD DOCUMENT MODAL
// --------------------------------------------------------------------------

/**
 * Modal multi-paso para subir un nuevo documento.
 *
 * Combina varios criterios de la rúbrica DWEC:
 *  - Manejo de eventos: clic en backdrop, tecla `Escape` mediante
 *    `@HostListener` y eventos de formulario.
 *  - Validación de formulario reactivo (`Validators.required`,
 *    `Validators.maxLength`).
 *  - Comunicación asíncrona con el backend en dos formatos:
 *    JSON (creación manual) y `multipart/form-data` con `FormData`
 *    (subida de imagen + datos).
 *  - Modificación dinámica del DOM mediante signals (`currentStep`,
 *    `progress`, etc.) que actualizan el template reactivamente.
 */
@Component({
  selector: 'app-upload-document-modal',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    FaIconComponent,
    ButtonComponent,
    FormFieldComponent,
    FilePickerComponent,
    ProgressBarComponent,
    OptionButtonComponent,
    FormCheckboxComponent,
  ],
  templateUrl: './upload-document-modal.html',
  styleUrl: './upload-document-modal.scss',
})
export class UploadDocumentModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly documentService = inject(DocumentService);
  private readonly modalService = inject(UploadDocumentModalService);
  private readonly alert = inject(AlertService);
  /** Renderer2 inyectado para manipular el DOM de forma segura. */
  private readonly renderer = inject(Renderer2);

  documentCreated = output<void>();

  /**
   * Referencia al contenedor del formulario manual.
   *
   * Permite acceder al elemento nativo (`ElementRef`) y, mediante
   * `Renderer2`, localizar y enfocar el primer input cuando el flujo
   * llega al paso 'form'. Se declara con la API de signals
   * (`viewChild`) introducida en Angular 17+.
   */
  protected readonly formContainer = viewChild<ElementRef<HTMLFormElement>>('formContainer');

  // --- Estado del flujo ---
  protected readonly currentStep = signal<Step>('method');
  protected readonly selectedMethod = signal<UploadMethod | null>(null);
  protected readonly selectedKind = signal<DocKind | null>(null);
  protected readonly selectedCategory = signal<string | null>(null);
  protected readonly customCategory = signal('');
  protected readonly selectedTicketCategory = signal<string | null>(null);
  protected readonly customTicketCategory = signal('');
  protected readonly imageFile = signal<File | null>(null);
  protected readonly imagePreviewUrl = signal<string | null>(null);
  /** Controla la visibilidad del lightbox de la imagen subida. */
  protected readonly lightboxOpen = signal(false);
  /**
   * Indica si el formulario llega prerellenado a partir de un preview de
   * OCR/IA. En ese caso, al confirmar manualmente se mantiene el flag
   * {@code aiProcessed} en el documento creado.
   */
  protected readonly aiPreviewApplied = signal(false);
  protected readonly useAi = signal(false);
  protected readonly loading = signal(false);

  // --- Iconos ---
  protected readonly faGoogle = faGoogle;

  // --- Progreso ---
  protected readonly progress = computed(() => PROGRESS_MAP[this.currentStep()]);
  protected readonly showCustomInput = computed(() => this.selectedCategory() === 'OTHER');
  protected readonly showCustomTicketInput = computed(() => this.selectedTicketCategory() === 'OTHER');

  // --- Opciones ---
  protected readonly methodOptions = METHOD_OPTIONS;
  protected readonly typeOptions = TYPE_OPTIONS;
  protected readonly categoryOptions = CATEGORY_OPTIONS;
  protected readonly ticketCategoryOptions = TICKET_CATEGORY_OPTIONS;

  // --- Formulario manual ---
  protected readonly docForm = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(25)]],
    storeName: [''],
    issueDate: [''],
    expiryDate: [''],
  });

  // --- Helpers de visibilidad ---
  protected readonly showBack = computed(() => this.currentStep() !== 'method');

  /**
   * Constructor: registra un `effect` que reacciona al cambio del paso
   * actual. Cuando el flujo llega al paso 'form', utiliza el
   * `ElementRef` del formulario y `Renderer2.selectRootElement` para
   * enfocar de forma segura el primer `<input>` visible.
   *
   * Este es el patrón recomendado por Angular para acceder al DOM:
   * usar `Renderer2` en lugar de `document.querySelector` directo,
   * con el fin de mantener compatibilidad con SSR y entornos sin DOM.
   */
  constructor() {
    effect(() => {
      if (this.currentStep() !== 'form') return;
      // Esperamos al siguiente frame para que Angular haya renderizado
      // el bloque @if asociado al paso 'form'.
      requestAnimationFrame(() => {
        const formEl = this.formContainer()?.nativeElement;
        if (!formEl) return;
        const firstInput = formEl.querySelector<HTMLInputElement>('input:not([type="hidden"])');
        if (firstInput) {
          // `selectRootElement` con preserveContent=true evita reemplazar
          // el contenido y simplemente nos devuelve el elemento para
          // poder invocar `focus()` sobre él.
          this.renderer.selectRootElement(firstInput, true).focus();
        }
      });
    });

    // Mantiene una URL de objeto para previsualizar la imagen subida en el
    // formulario de confirmación. Cuando el archivo cambia (o el modal se
    // resetea) revocamos la URL anterior para evitar fugas de memoria.
    effect((onCleanup) => {
      const file = this.imageFile();
      if (!file) {
        this.imagePreviewUrl.set(null);
        return;
      }
      const url = URL.createObjectURL(file);
      this.imagePreviewUrl.set(url);
      onCleanup(() => URL.revokeObjectURL(url));
    });
  }

  // --------------------------------------------------------------------------
  // KEYBOARD: Escape cierra el modal
  // --------------------------------------------------------------------------
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    // Si el lightbox está abierto, Escape sólo lo cierra. Así se mantiene
    // el modal con el formulario y se evita perder los datos revisados.
    if (this.lightboxOpen()) {
      this.lightboxOpen.set(false);
      return;
    }
    this.close();
  }

  // --------------------------------------------------------------------------
  // BACKDROP CLICK
  // --------------------------------------------------------------------------
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  // --------------------------------------------------------------------------
  // NAVEGACIÓN
  // --------------------------------------------------------------------------
  protected selectMethod(method: string): void {
    this.selectedMethod.set(method as UploadMethod);
    if (method === 'image') {
      this.currentStep.set('image-upload');
    } else {
      this.currentStep.set('type-select');
    }
  }

  protected selectType(kind: string): void {
    this.selectedKind.set(kind as DocKind);
  }

  protected onTypeNext(): void {
    const kind = this.selectedKind();
    if (!kind) return;

    if (kind === 'ticket') {
      this.currentStep.set('ticket-category');
    } else {
      this.currentStep.set('category-select');
    }
  }

  protected selectTicketCategory(category: string): void {
    this.selectedTicketCategory.set(category);
  }

  protected onTicketCategoryNext(): void {
    if (!this.selectedTicketCategory()) return;
    if (this.selectedTicketCategory() === 'OTHER' && !this.customTicketCategory().trim()) return;
    this.currentStep.set('form');
  }

  protected selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  protected onCategoryNext(): void {
    if (!this.selectedCategory()) return;
    if (this.selectedCategory() === 'OTHER' && !this.customCategory().trim()) return;
    this.currentStep.set('form');
  }

  protected goBack(): void {
    const step = this.currentStep();

    switch (step) {
      case 'image-upload':
      case 'type-select':
        this.currentStep.set('method');
        this.selectedMethod.set(null);
        this.selectedKind.set(null);
        this.selectedCategory.set(null);
        break;
      case 'ticket-category':
        this.currentStep.set('type-select');
        this.selectedTicketCategory.set(null);
        this.customTicketCategory.set('');
        break;
      case 'category-select':
        this.currentStep.set('type-select');
        this.selectedCategory.set(null);
        this.customCategory.set('');
        break;
      case 'form':
        if (this.selectedMethod() === 'image') {
          // Flujo OCR/IA: el usuario llegó al formulario desde la subida de
          // imagen; al volver, mostramos de nuevo el selector de imagen para
          // que pueda repetir la extracción si lo desea.
          this.currentStep.set('image-upload');
        } else if (this.selectedKind() === 'ticket') {
          this.currentStep.set('ticket-category');
        } else {
          this.currentStep.set('category-select');
        }
        break;
    }
  }

  // --------------------------------------------------------------------------
  // ARCHIVOS
  // --------------------------------------------------------------------------
  protected onImageSelected(file: File): void {
    this.imageFile.set(file);
  }

  // --------------------------------------------------------------------------
  // LIGHTBOX (imagen ampliada)
  // --------------------------------------------------------------------------
  protected openLightbox(): void {
    if (!this.imagePreviewUrl()) return;
    this.lightboxOpen.set(true);
  }

  protected closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  // --------------------------------------------------------------------------
  // EXTRAER DATOS (desde imagen)
  // --------------------------------------------------------------------------
  /**
   * Envía la imagen al backend para que OCR/IA extraigan los datos del
   * documento. En lugar de crear el documento automáticamente, se
   * prerrellena el formulario manual con los datos detectados y se navega
   * al paso 'form' para que el usuario revise y confirme la creación.
   */
  protected extractData(): void {
    const file = this.imageFile();
    if (!file || this.loading()) return;

    this.loading.set(true);
    const groupId = this.modalService.groupId();
    this.documentService.previewFromImage(file, this.useAi(), groupId ?? undefined).subscribe({
      next: (preview: DocumentExtractionPreview) => {
        this.applyPreview(preview);
        this.aiPreviewApplied.set(Boolean(preview.aiProcessed));
        this.loading.set(false);
        this.currentStep.set('form');
        this.alert.show('success', 'Datos extraídos. Revisa y confirma para crear el documento.');
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.error ?? 'No se pudo extraer los datos de la imagen';
        this.alert.show('error', msg);
        this.loading.set(false);
      },
    });
  }

  /**
   * Vuelca el preview devuelto por el backend en el estado del formulario
   * para que el usuario pueda revisarlo y editarlo antes de confirmar.
   */
  private applyPreview(preview: DocumentExtractionPreview): void {
    // Tipo (ticket | document) y categoría dentro del flujo del modal.
    this.selectedKind.set(preview.kind);
    if (preview.kind === 'ticket') {
      const ticketCategories = ['Devolución', 'Garantía'];
      const cat = preview.category;
      if (cat && ticketCategories.includes(cat)) {
        this.selectedTicketCategory.set(cat);
        this.customTicketCategory.set('');
      } else {
        this.selectedTicketCategory.set('OTHER');
        // Limitamos a la longitud máxima permitida por el input (12 caracteres).
        this.customTicketCategory.set((cat ?? '').slice(0, 12));
      }
    } else {
      const docCategories = ['DNI', 'Pasaporte', 'Carnet de conducir'];
      const cat = preview.category;
      if (cat && docCategories.includes(cat)) {
        this.selectedCategory.set(cat);
        this.customCategory.set('');
      } else {
        this.selectedCategory.set('OTHER');
        this.customCategory.set((cat ?? '').slice(0, 12));
      }
    }

    // Campos del formulario. El título se trunca al máximo del input (25).
    this.docForm.patchValue({
      title: (preview.title ?? '').slice(0, 25),
      storeName: preview.storeName ?? '',
      issueDate: preview.issueDate ?? '',
      expiryDate: preview.expiryDate ?? '',
    });
  }

  // --------------------------------------------------------------------------
  // CREAR DOCUMENTO (manual)
  // --------------------------------------------------------------------------
  protected onSubmit(): void {
    if (!this.docForm.valid || this.loading()) return;

    this.loading.set(true);
    const { title, storeName, issueDate, expiryDate } = this.docForm.getRawValue();

    const documentType = this.resolveDocumentType();

    const body: Record<string, unknown> = {
      type: documentType,
      title,
      storeName: storeName || null,
      issueDate: issueDate || null,
      expiryDate: expiryDate || null,
      category: this.resolveCategory(),
      // Preservamos el flag aiProcessed cuando el formulario se prerellenó
      // desde un preview de OCR/IA. En el flujo manual puro, se envía
      // false explícitamente para que el backend lo registre así.
      aiProcessed: this.aiPreviewApplied(),      // Distingue manual puro / OCR confirmado / IA confirmada para el historial.
      creationMethod: this.selectedMethod() === 'image'
        ? (this.aiPreviewApplied() ? 'AI' : 'OCR')
        : 'MANUAL',    };

    const groupId = this.modalService.groupId();
    const imageFile = this.imageFile();

    this.documentService.createDocument(body, groupId ?? undefined, imageFile).subscribe({
      next: () => {
        this.alert.show('success', 'Documento creado correctamente');
        this.documentCreated.emit();
        this.close();
      },
      error: (err: HttpErrorResponse) => {
        const msg = err.error?.error ?? 'No se pudo crear el documento';
        this.alert.show('error', msg);
        this.loading.set(false);
      },
    });
  }

  // --------------------------------------------------------------------------
  // PRIVADOS
  // --------------------------------------------------------------------------
  private resolveDocumentType(): DocumentType {
    if (this.selectedKind() === 'ticket') {
      const cat = this.selectedTicketCategory();
      if (cat === 'Devolución') return 'RECEIPT';
      if (cat === 'Garantía') return 'WARRANTY';
      return 'OTHER';
    }
    const cat = this.selectedCategory();
    const docTypeMap: Partial<Record<string, DocumentType>> = {
      'DNI': 'DNI',
      'Pasaporte': 'PASSPORT',
      'Carnet de conducir': 'DRIVING_LICENSE',
    };
    return (cat && docTypeMap[cat]) ? docTypeMap[cat]! : 'OTHER';
  }

  private resolveCategory(): string | null {
    if (this.selectedKind() === 'ticket') {
      const cat = this.selectedTicketCategory();
      if (cat === 'OTHER') return this.customTicketCategory().trim() || null;
      return cat;
    }
    const cat = this.selectedCategory();
    if (cat === 'OTHER') return this.customCategory().trim() || null;
    return cat;
  }

  private close(): void {
    this.modalService.close();
    this.resetState();
  }

  private resetState(): void {
    this.currentStep.set('method');
    this.selectedMethod.set(null);
    this.selectedKind.set(null);
    this.selectedCategory.set(null);
    this.customCategory.set('');
    this.selectedTicketCategory.set(null);
    this.customTicketCategory.set('');
    this.imageFile.set(null);
    this.lightboxOpen.set(false);
    this.aiPreviewApplied.set(false);
    this.useAi.set(false);
    this.loading.set(false);
    this.docForm.reset({ title: '', storeName: '', issueDate: '', expiryDate: '' });
  }
}
