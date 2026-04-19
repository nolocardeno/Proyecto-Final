// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faArrowLeft,
  faCircleInfo,
  faClockRotateLeft,
  faBell,
  faFileLines,
  faCircleExclamation,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ButtonComponent } from '../../components/shared/button/button';
import { TabBarComponent, type Tab } from '../../components/shared/tab-bar/tab-bar';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';
import { type DocumentResponse, type DocumentType, type DocumentStatus, formatDate, getCardType } from '../../models/document.model';

// --------------------------------------------------------------------------
// PÁGINA: DOCUMENT DETAIL
// --------------------------------------------------------------------------
const STATUS_LABELS: Record<DocumentStatus, string> = {
  ACTIVE: 'Activo',
  EXPIRING_SOON: 'Por expirar',
  EXPIRED: 'Expirado',
  RENEWED: 'Renovado',
};

@Component({
  selector: 'app-document-detail',
  imports: [FaIconComponent, SidebarComponent, PageHeaderComponent, ButtonComponent, TabBarComponent],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.scss',
})
export class DocumentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  protected readonly authService = inject(AuthService);

  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faFileLines = faFileLines;
  protected readonly faCircleExclamation = faCircleExclamation;
  protected readonly faCircleCheck = faCircleCheck;
  protected readonly formatDate = formatDate;
  protected readonly getTypeLabel = (type: DocumentType): string =>
    getCardType(type) === 'ticket' ? 'Ticket' : 'Documento';

  protected getStatusLabel(status: DocumentStatus): string {
    return STATUS_LABELS[status];
  }

  protected getStatusSubtitle(daysRemaining: number | null): string {
    if (daysRemaining === null) return 'Sin fecha de expiración';
    if (daysRemaining < 0) return `Hace ${Math.abs(daysRemaining)} día(s)`;
    return `Quedan ${daysRemaining} día(s)`;
  }

  protected readonly currentPage = signal<SidebarPage>('Dashboard');
  protected readonly document = signal<DocumentResponse | null>(null);
  protected readonly groupId = signal<number | null>(null);
  protected readonly activeTab = signal('details');
  protected readonly lightboxSrc = signal<string | null>(null);

  protected readonly tabs: Tab[] = [
    { key: 'details', label: 'Detalles del documento', icon: faCircleInfo },
    { key: 'alerts', label: 'Alertas y exportación', icon: faBell },
    { key: 'history', label: 'Historial de versiones', icon: faClockRotateLeft },
  ];

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const groupIdParam = this.route.snapshot.queryParamMap.get('groupId');
    if (groupIdParam) {
      this.groupId.set(Number(groupIdParam));
      this.currentPage.set('Groups');
    }
    this.documentService.getDocument(id).subscribe((doc) => {
      this.document.set(doc);
    });
  }

  protected goBack(): void {
    const gid = this.groupId();
    if (gid !== null) {
      this.router.navigate(['/groups', gid]);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  protected isExpired(doc: DocumentResponse): boolean {
    return doc.status === 'EXPIRED';
  }

  protected openLightbox(src: string): void {
    this.lightboxSrc.set(src);
  }

  protected closeLightbox(): void {
    this.lightboxSrc.set(null);
  }

  protected onNavigate(page: string): void {
    if (page === 'Logout') { this.authService.logout(); this.router.navigate(['/']); return; }
    this.router.navigate(['/' + page.toLowerCase()]);
  }
}
