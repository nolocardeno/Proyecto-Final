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
  faTrash,
  faPenToSquare,
} from '@fortawesome/free-solid-svg-icons';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ButtonComponent } from '../../components/shared/button/button';
import { TabBarComponent, type Tab } from '../../components/shared/tab-bar/tab-bar';
import { DocumentService } from '../../services/document.service';
import { DocumentAlertService, type DocumentAlertResponse } from '../../services/document-alert.service';
import { ConfirmModalComponent } from '../../components/shared/confirm-modal/confirm-modal';
import { AlertService } from '../../services/alert.service';
import { AuthService } from '../../services/auth.service';
import { type DocumentResponse, type DocumentType, type DocumentStatus, formatDate, getCardType } from '../../models/document.model';
import {
  buildGoogleCalendarUrl,
  buildOutlookCalendarUrl,
  downloadIcsFile,
} from '../../utils/calendar-export.utils';
import { DocumentPreviewCardComponent } from '../../components/shared/document-preview-card/document-preview-card';
import { DocumentInfoCardComponent, type InfoField } from '../../components/shared/document-info-card/document-info-card';
import { DocumentStatusCardComponent } from '../../components/shared/document-status-card/document-status-card';
import { AlertsSectionComponent } from '../../components/shared/alerts-section/alerts-section';
import { ExportSectionComponent } from '../../components/shared/export-section/export-section';
import { EditDocumentModalComponent } from '../../components/shared/edit-document-modal/edit-document-modal';
import { VersionHistoryComponent } from '../../components/shared/version-history/version-history';
import { DocumentHistoryService, type DocumentHistoryEntry } from '../../services/document-history.service';

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
  imports: [
    FaIconComponent,
    SidebarComponent,
    PageHeaderComponent,
    ButtonComponent,
    TabBarComponent,
    ConfirmModalComponent,
    DocumentPreviewCardComponent,
    DocumentInfoCardComponent,
    DocumentStatusCardComponent,
    AlertsSectionComponent,
    ExportSectionComponent,
    EditDocumentModalComponent,
    VersionHistoryComponent,
  ],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.scss',
})
export class DocumentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  private readonly documentAlertService = inject(DocumentAlertService);
  private readonly alertService = inject(AlertService);
  private readonly documentHistoryService = inject(DocumentHistoryService);
  protected readonly authService = inject(AuthService);

  // Icons
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faTrash = faTrash;
  protected readonly faPenToSquare = faPenToSquare;

  protected readonly formatDate = formatDate;
  protected readonly getTypeLabel = (type: DocumentType): string =>
    getCardType(type) === 'ticket' ? 'Ticket' : 'Documento';

  // Preset alert options (days before expiry)
  protected readonly presetAlertDays = [1, 7, 30] as const;

  protected getStatusLabel(status: DocumentStatus): string {
    return STATUS_LABELS[status];
  }

  protected getStatusSubtitle(daysRemaining: number | null): string {
    if (daysRemaining === null) return 'Sin fecha de expiración';
    if (daysRemaining < 0) return `Hace ${Math.abs(daysRemaining)} día(s)`;
    return `Quedan ${daysRemaining} día(s)`;
  }

  protected infoFields(doc: DocumentResponse): InfoField[] {
    return [
      { label: 'Nombre', value: doc.title },
      { label: 'Comercio', value: doc.storeName ?? '—' },
      { label: 'Tipo', value: this.getTypeLabel(doc.type) },
      { label: 'Categoría', value: doc.category ?? doc.type },
    ];
  }

  protected readonly currentPage = signal<SidebarPage>('Dashboard');
  protected readonly document = signal<DocumentResponse | null>(null);
  protected readonly groupId = signal<number | null>(null);
  protected readonly activeTab = signal('details');
  protected readonly lightboxSrc = signal<string | null>(null);

  // Alerts state
  protected readonly activeAlerts = signal<DocumentAlertResponse[]>([]);
  protected alertToDelete = signal<DocumentAlertResponse | null>(null);

  // History state
  protected readonly historyEntries = signal<DocumentHistoryEntry[]>([]);

  // Document actions state
  protected readonly showDeleteDocConfirm = signal(false);
  protected readonly showEditDocModal = signal(false);

  protected get customAlerts(): DocumentAlertResponse[] {
    return this.activeAlerts()
      .filter((a) => !(this.presetAlertDays as readonly number[]).includes(a.daysBeforeExpiry))
      .slice(0, 3);
  }

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
      this.loadAlerts(doc.id);
      this.loadHistory(doc.id);
    });
  }

  // --------------------------------------------------------------------------
  // ALERTS
  // --------------------------------------------------------------------------

  private loadAlerts(documentId: number): void {
    this.documentAlertService.getAlerts(documentId).subscribe({
      next: (alerts) => this.activeAlerts.set(alerts),
      error: () => {},
    });
  }

  private loadHistory(documentId: number): void {
    this.documentHistoryService.getHistory(documentId).subscribe({
      next: (entries) => this.historyEntries.set(entries),
      error: () => {},
    });
  }

  private isAlertActive(days: number): boolean {
    return this.activeAlerts().some((a) => a.daysBeforeExpiry === days);
  }

  private getAlertId(days: number): number | undefined {
    return this.activeAlerts().find((a) => a.daysBeforeExpiry === days)?.id;
  }

  protected toggleAlert(days: number): void {
    const doc = this.document();
    if (!doc) return;

    if (this.isAlertActive(days)) {
      const alertId = this.getAlertId(days);
      if (alertId === undefined) return;
      this.documentAlertService.deleteAlert(doc.id, alertId).subscribe({
        next: () => {
          this.activeAlerts.update((alerts) => alerts.filter((a) => a.id !== alertId));
          this.alertService.show('info', `Alerta de ${days} día(s) eliminada`);
        },
        error: () => this.alertService.show('error', 'No se pudo eliminar la alerta'),
      });
    } else {
      this.documentAlertService.createAlert(doc.id, days).subscribe({
        next: (alert) => {
          this.activeAlerts.update((alerts) => [...alerts, alert]);
          this.alertService.show('success', `Alerta de ${days} día(s) activada`);
        },
        error: (err) => {
          const msg = err.status === 409 ? 'Ya existe esa alerta' : 'No se pudo crear la alerta';
          this.alertService.show('error', msg);
        },
      });
    }
  }

  protected addCustomAlertDays(days: number): void {
    if (isNaN(days) || days < 1) {
      this.alertService.show('error', 'Introduce un número de días válido (mínimo 1)');
      return;
    }
    if (this.isAlertActive(days)) {
      this.alertService.show('warning', `Ya tienes una alerta para ${days} día(s) antes`);
      return;
    }
    const isCustomDay = !(this.presetAlertDays as readonly number[]).includes(days);
    if (isCustomDay && this.customAlerts.length >= 3) {
      this.alertService.show('warning', 'Máximo 3 alertas personalizadas permitidas');
      return;
    }
    const doc = this.document();
    if (!doc) return;
    this.documentAlertService.createAlert(doc.id, days).subscribe({
      next: (alert) => {
        this.activeAlerts.update((alerts) => [...alerts, alert]);
        this.alertService.show('success', `Alerta de ${days} día(s) activada`);
      },
      error: (err) => {
        const msg = err.status === 409 ? 'Ya existe esa alerta' : 'No se pudo crear la alerta';
        this.alertService.show('error', msg);
      },
    });
  }

  private removeAlert(alertId: number): void {
    const doc = this.document();
    if (!doc) return;
    this.documentAlertService.deleteAlert(doc.id, alertId).subscribe({
      next: () => {
        this.activeAlerts.update((alerts) => alerts.filter((a) => a.id !== alertId));
        this.alertService.show('info', 'Alerta eliminada');
      },
      error: () => this.alertService.show('error', 'No se pudo eliminar la alerta'),
    });
  }

  protected requestDeleteAlert(alert: DocumentAlertResponse): void {
    this.alertToDelete.set(alert);
  }

  protected onConfirmDelete(): void {
    const alert = this.alertToDelete();
    if (!alert) return;
    this.alertToDelete.set(null);
    this.removeAlert(alert.id);
  }

  protected onCancelDelete(): void {
    this.alertToDelete.set(null);
  }

  // --------------------------------------------------------------------------
  // DOCUMENT DELETE
  // --------------------------------------------------------------------------

  protected requestDeleteDocument(): void {
    this.showDeleteDocConfirm.set(true);
  }

  protected onConfirmDeleteDocument(): void {
    const doc = this.document();
    if (!doc) return;
    this.showDeleteDocConfirm.set(false);
    this.documentService.deleteDocument(doc.id).subscribe({
      next: () => {
        this.alertService.show('success', 'Documento eliminado correctamente');
        this.goBack();
      },
      error: () => this.alertService.show('error', 'No se pudo eliminar el documento'),
    });
  }

  protected onCancelDeleteDocument(): void {
    this.showDeleteDocConfirm.set(false);
  }

  // --------------------------------------------------------------------------
  // DOCUMENT EDIT
  // --------------------------------------------------------------------------

  protected openEditModal(): void {
    this.showEditDocModal.set(true);
  }

  protected onDocumentSaved(updated: DocumentResponse): void {
    this.document.set(updated);
    this.loadHistory(updated.id);
    this.showEditDocModal.set(false);
  }

  protected onEditCancelled(): void {
    this.showEditDocModal.set(false);
  }

  // --------------------------------------------------------------------------
  // CALENDAR EXPORT
  // --------------------------------------------------------------------------

  protected openGoogleCalendar(): void {
    const doc = this.document();
    if (!doc?.expiryDate) return;
    const url = buildGoogleCalendarUrl({ title: doc.title, expiryDate: doc.expiryDate });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected openOutlookCalendar(): void {
    const doc = this.document();
    if (!doc?.expiryDate) return;
    const url = buildOutlookCalendarUrl({ title: doc.title, expiryDate: doc.expiryDate });
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  protected downloadIcs(): void {
    const doc = this.document();
    if (!doc?.expiryDate) return;
    downloadIcsFile({ title: doc.title, expiryDate: doc.expiryDate });
  }

  // --------------------------------------------------------------------------
  // NAVIGATION / MISC
  // --------------------------------------------------------------------------

  protected goBack(): void {
    const gid = this.groupId();
    if (gid !== null) {
      this.router.navigate(['/groups', gid]);
    } else {
      this.router.navigate(['/dashboard']);
    }
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
