// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ButtonComponent } from '../../components/shared/button/button';
import { DocumentService } from '../../services/document.service';
import { AuthService } from '../../services/auth.service';
import { type DocumentResponse, formatDate, getStatusText } from '../../models/document.model';

// --------------------------------------------------------------------------
// PÁGINA: DOCUMENT DETAIL
// --------------------------------------------------------------------------
@Component({
  selector: 'app-document-detail',
  imports: [FaIconComponent, SidebarComponent, PageHeaderComponent, ButtonComponent],
  templateUrl: './document-detail.html',
  styleUrl: './document-detail.scss',
})
export class DocumentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly documentService = inject(DocumentService);
  protected readonly authService = inject(AuthService);

  protected readonly faArrowLeft = faArrowLeft;
  protected readonly formatDate = formatDate;
  protected readonly getStatusText = getStatusText;

  protected readonly currentPage = signal<SidebarPage>('Dashboard');
  protected readonly document = signal<DocumentResponse | null>(null);
  protected readonly groupId = signal<number | null>(null);

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

  onNavigate(page: string): void {
    if (page === 'Logout') { this.authService.logout(); this.router.navigate(['/']); return; }
    this.router.navigate(['/' + page.toLowerCase()]);
  }
}
