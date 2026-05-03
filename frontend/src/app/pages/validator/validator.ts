// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ValidatorCardComponent } from '../../components/shared/validator-card/validator-card';
import { ValidatorResultCardComponent } from '../../components/shared/validator-result-card/validator-result-card';
import { AuthService } from '../../services/auth.service';
import { DocumentService } from '../../services/document.service';
import {
  formatDate,
  getCardType,
  type DocumentResponse,
} from '../../models/document.model';

// --------------------------------------------------------------------------
// TIPOS
// --------------------------------------------------------------------------

/** Resultado de comprobar la validez de un documento en una fecha dada. */
interface ValidatorResult {
  document: DocumentResponse;
  isValid: boolean;
  expiryDate: string;
}

// --------------------------------------------------------------------------
// PÁGINA: VALIDADOR DE DOCUMENTOS OFICIALES
// --------------------------------------------------------------------------

/**
 * Página que permite al usuario seleccionar una fecha (por ejemplo, la de
 * un viaje) y comprobar de un vistazo qué documentos oficiales seguirán
 * vigentes ese día. Los resultados se calculan reactivamente con
 * `computed` a partir de la fecha y la lista de documentos.
 */
@Component({
  selector: 'app-validator',
  imports: [
    SidebarComponent,
    PageHeaderComponent,
    ValidatorCardComponent,
    ValidatorResultCardComponent,
  ],
  templateUrl: './validator.html',
  styleUrl: './validator.scss',
})
export class ValidatorComponent {
  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  private readonly authService = inject(AuthService);

  protected readonly currentPage = signal<SidebarPage>('Validator');
  protected readonly checkedDate = signal<Date | null>(null);
  protected readonly documents = signal<DocumentResponse[]>([]);
  protected readonly hasChecked = computed(() => this.checkedDate() !== null);

  /** Lista reactiva de resultados, recalculada al cambiar la fecha o los documentos. */
  protected readonly results = computed<ValidatorResult[]>(() => {
    const date = this.checkedDate();
    if (!date) return [];
    return this.documents()
      .filter((doc) => getCardType(doc.type) === 'document')
      .map((doc) => ({
        document: doc,
        isValid: this.isDocumentValid(doc, date),
        expiryDate: formatDate(doc.expiryDate),
      }));
  });

  /** Manejador de la navegación del sidebar. */
  onNavigate(page: string): void {
    if (page === 'Validator') return;
    if (page === 'Logout') {
      this.authService.logout();
      this.router.navigate(['/']);
      return;
    }
    this.router.navigate(['/' + page.toLowerCase()]);
  }

  /**
   * Manejador del botón «Comprobar». Recupera los documentos del usuario
   * y guarda la fecha objetivo, lo que dispara el recálculo de `results`.
   */
  protected onCheck(date: Date): void {
    this.documentService.getDocuments().subscribe((documents) => {
      this.documents.set(documents);
      this.checkedDate.set(date);
    });
  }

  // ------------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------------

  /** Devuelve `true` si el documento sigue vigente en la fecha dada. */
  private isDocumentValid(doc: DocumentResponse, date: Date): boolean {
    if (!doc.expiryDate) return true; // Sin fecha de expiración → siempre válido
    const expiry = new Date(doc.expiryDate);
    return date.getTime() <= expiry.getTime();
  }
}
