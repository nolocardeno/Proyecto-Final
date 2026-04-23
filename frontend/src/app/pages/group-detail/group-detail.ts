// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCirclePlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ButtonComponent } from '../../components/shared/button/button';
import { FilterBarComponent, type FilterType } from '../../components/shared/filter-bar/filter-bar';
import { SearchBarComponent } from '../../components/shared/search-bar/search-bar';
import { DocumentCardComponent } from '../../components/shared/document-card/document-card';
import { GroupCodeCardComponent } from '../../components/shared/group-code-card/group-code-card';
import { GroupMembersCardComponent } from '../../components/shared/group-members-card/group-members-card';
import { UploadDocumentModalComponent } from '../../components/shared/upload-document-modal/upload-document-modal';
import { DeleteGroupCardComponent } from '../../components/shared/delete-group-card/delete-group-card';
import { GroupService } from '../../services/group.service';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { UploadDocumentModalService } from '../../services/upload-document-modal.service';
import { type GroupDetailResponse } from '../../models/group.model';
import {
  type DocumentResponse,
  getCardType,
  formatDate,
  getStatusText,
} from '../../models/document.model';

// --------------------------------------------------------------------------
// PÁGINA: GROUP DETAIL
// --------------------------------------------------------------------------
@Component({
  selector: 'app-group-detail',
  imports: [
    FaIconComponent,
    SidebarComponent,
    PageHeaderComponent,
    ButtonComponent,
    FilterBarComponent,
    SearchBarComponent,
    DocumentCardComponent,
    GroupCodeCardComponent,
    GroupMembersCardComponent,
    UploadDocumentModalComponent,
    DeleteGroupCardComponent,
  ],
  templateUrl: './group-detail.html',
  styleUrl: './group-detail.scss',
})
export class GroupDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly groupService = inject(GroupService);
  protected readonly authService = inject(AuthService);
  private readonly alertService = inject(AlertService);
  protected readonly uploadModal = inject(UploadDocumentModalService);

  protected readonly faCirclePlus = faCirclePlus;
  protected readonly faArrowLeft = faArrowLeft;

  protected readonly currentPage = signal<SidebarPage>('Groups');
  protected readonly group = signal<GroupDetailResponse | null>(null);
  protected readonly documents = signal<DocumentResponse[]>([]);
  protected readonly activeFilter = signal<FilterType>('all');
  protected readonly searchTerm = signal('');
  protected readonly filterCounts = signal<Record<FilterType, number>>({
    all: 0,
    tickets: 0,
    documents: 0,
    expired: 0,
  });

  protected readonly filteredDocuments = computed(() => {
    const docs = this.documents();
    const filter = this.activeFilter();
    const term = this.searchTerm().toLowerCase().trim();

    let result: DocumentResponse[];

    switch (filter) {
      case 'tickets':
        result = docs.filter((d: DocumentResponse) => getCardType(d.type) === 'ticket');
        break;
      case 'documents':
        result = docs.filter((d: DocumentResponse) => getCardType(d.type) === 'document');
        break;
      case 'expired':
        result = docs.filter((d: DocumentResponse) => d.status === 'EXPIRED');
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

  // --- Helpers accesibles desde el template ---
  protected readonly getCardType = getCardType;
  protected readonly formatDate = formatDate;
  protected readonly getStatusText = getStatusText;

  ngOnInit(): void {
    const groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadGroupDetail(groupId);
    this.loadGroupDocuments(groupId);
  }

  protected reloadDocuments(): void {
    const groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadGroupDocuments(groupId);
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
  }

  protected goBack(): void {
    this.router.navigate(['/groups']);
  }

  protected onDeleteGroupConfirmed(): void {
    const groupId = Number(this.route.snapshot.paramMap.get('id'));
    this.groupService.deleteGroup(groupId).subscribe(() => {
      this.alertService.show('success', 'El grupo ha sido eliminado correctamente.');
      this.router.navigate(['/groups']);
    });
  }

  onNavigate(page: string): void {
    if (page === 'Logout') {
      this.authService.logout();
      this.router.navigate(['/']);
      return;
    }

    if (page === 'Groups') {
      this.router.navigate(['/groups']);
      return;
    }

    this.router.navigate(['/' + page.toLowerCase()]);
  }

  private loadGroupDetail(id: number): void {
    this.groupService.getGroupDetail(id).subscribe((detail: GroupDetailResponse) => {
      this.group.set(detail);
    });
  }

  private loadGroupDocuments(id: number): void {
    this.groupService.getGroupDocuments(id).subscribe((docs: DocumentResponse[]) => {
      this.documents.set(docs);
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
}
