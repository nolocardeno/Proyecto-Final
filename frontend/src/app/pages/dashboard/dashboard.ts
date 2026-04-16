// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCirclePlus } from '@fortawesome/free-solid-svg-icons';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { DocumentCardComponent } from '../../components/shared/document-card/document-card';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ButtonComponent } from '../../components/shared/button/button';
import { FilterBarComponent, type FilterType } from '../../components/shared/filter-bar/filter-bar';
import { SearchBarComponent } from '../../components/shared/search-bar/search-bar';
import { UploadDocumentModalComponent } from '../../components/shared/upload-document-modal/upload-document-modal';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';
import { UploadDocumentModalService } from '../../services/upload-document-modal.service';
import {
  type DocumentResponse,
  getCardType,
  formatDate,
  getStatusText,
} from '../../models/document.model';

// --------------------------------------------------------------------------
// PÁGINA: DASHBOARD
// --------------------------------------------------------------------------
@Component({
  selector: 'app-dashboard',
  imports: [FaIconComponent, SidebarComponent, DocumentCardComponent, PageHeaderComponent, ButtonComponent, FilterBarComponent, SearchBarComponent, UploadDocumentModalComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class DashboardComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  protected readonly authService = inject(AuthService);

  protected readonly faCirclePlus = faCirclePlus;
  protected readonly uploadModal = inject(UploadDocumentModalService);
  private readonly router = inject(Router);

  protected readonly currentPage = signal<SidebarPage>('Dashboard');
  protected readonly documentos = signal<DocumentResponse[]>([]);
  protected readonly activeFilter = signal<FilterType>('all');
  protected readonly searchTerm = signal('');
  protected readonly filterCounts = signal<Record<FilterType, number>>({
    all: 0,
    tickets: 0,
    documents: 0,
    expired: 0,
  });

  protected readonly filteredDocuments = computed(() => {
    const docs = this.documentos();
    const filter = this.activeFilter();
    const term = this.searchTerm().toLowerCase().trim();

    let result: DocumentResponse[];

    switch (filter) {
      case 'tickets':
        result = docs.filter((d) => getCardType(d.type) === 'ticket');
        break;
      case 'documents':
        result = docs.filter((d) => getCardType(d.type) === 'document');
        break;
      case 'expired':
        result = docs.filter((d) => d.status === 'EXPIRED');
        break;
      default:
        result = docs;
    }

    if (term) {
      result = result.filter((d) =>
        d.title.toLowerCase().includes(term) ||
        d.category?.toLowerCase().includes(term) ||
        d.storeName?.toLowerCase().includes(term)
      );
    }

    return result;
  });

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  // --- Helpers accesibles desde el template ---
  protected readonly getCardType = getCardType;
  protected readonly formatDate = formatDate;
  protected readonly getStatusText = getStatusText;

  ngOnInit(): void {
    this.loadDocuments();
  }

  protected loadDocuments(): void {
    this.documentService.getDocuments().subscribe((docs) => {
      this.documentos.set(docs);
      this.updateFilterCounts(docs);
    });
  }

  private updateFilterCounts(docs: DocumentResponse[]): void {
    const tickets = docs.filter((d) => getCardType(d.type) === 'ticket').length;
    const documents = docs.filter((d) => getCardType(d.type) === 'document').length;
    const expired = docs.filter((d) => d.status === 'EXPIRED').length;

    this.filterCounts.set({
      all: docs.length,
      tickets,
      documents,
      expired,
    });
  }

  onNavigate(page: string): void {
    if (page === 'Logout') {
      this.authService.logout();
      this.router.navigate(['/']);
      return;
    }

    if (page === 'Dashboard') {
      this.currentPage.set(page as SidebarPage);
      return;
    }

    this.router.navigate(['/' + page.toLowerCase()]);
  }
}
