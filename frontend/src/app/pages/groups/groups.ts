// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCirclePlus, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { GroupCardComponent } from '../../components/shared/group-card/group-card';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ButtonComponent } from '../../components/shared/button/button';
import { SearchBarComponent } from '../../components/shared/search-bar/search-bar';
import { PaginationComponent } from '../../components/shared/pagination/pagination';
import { CreateGroupModalComponent } from '../../components/shared/create-group-modal/create-group-modal';
import { JoinGroupModalComponent } from '../../components/shared/join-group-modal/join-group-modal';
import { GroupService } from '../../services/group.service';
import { GroupModalService } from '../../services/group-modal.service';
import { JoinGroupModalService } from '../../services/join-group-modal.service';
import { AuthService } from '../../services/auth.service';
import { type GroupResponse } from '../../models/group.model';

// --------------------------------------------------------------------------
// PÁGINA: GROUPS
// --------------------------------------------------------------------------
@Component({
  selector: 'app-groups',
  imports: [
    FaIconComponent,
    SidebarComponent,
    GroupCardComponent,
    PageHeaderComponent,
    ButtonComponent,
    SearchBarComponent,
    PaginationComponent,
    CreateGroupModalComponent,
    JoinGroupModalComponent,
  ],
  templateUrl: './groups.html',
  styleUrl: './groups.scss',
})
export class GroupsComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  protected readonly groupModal = inject(GroupModalService);
  protected readonly joinGroupModal = inject(JoinGroupModalService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly faCirclePlus = faCirclePlus;
  protected readonly faUserPlus = faUserPlus;

  protected readonly currentPage = signal<SidebarPage>('Groups');
  protected readonly groups = signal<GroupResponse[]>([]);
  protected readonly searchTerm = signal('');

  protected readonly filteredGroups = signal<GroupResponse[]>([]);

  // --- Paginación ---
  protected readonly paginationPageSize = 9;
  protected readonly paginationPage = signal(1);

  protected readonly pagedGroups = computed(() => {
    const groups = this.filteredGroups();
    const start = (this.paginationPage() - 1) * this.paginationPageSize;
    return groups.slice(start, start + this.paginationPageSize);
  });

  constructor() {
    // Reset a la primera página al cambiar la búsqueda
    effect(() => {
      this.searchTerm();
      this.paginationPage.set(1);
    });
  }

  protected onSearch(term: string): void {
    this.searchTerm.set(term);
    this.applyFilter();
  }

  ngOnInit(): void {
    this.loadGroups();
  }

  protected onGroupCreated(): void {
    this.loadGroups();
  }

  protected onGroupJoined(): void {
    this.loadGroups();
  }

  protected onViewDocuments(groupId: number): void {
    this.router.navigate(['/groups', groupId]);
  }

  onNavigate(page: string): void {
    if (page === 'Logout') {
      this.authService.logout();
      this.router.navigate(['/']);
      return;
    }

    if (page === 'Groups') {
      this.currentPage.set(page as SidebarPage);
      return;
    }

    this.router.navigate(['/' + page.toLowerCase()]);
  }

  private loadGroups(): void {
    this.groupService.getGroups().subscribe((groups: GroupResponse[]) => {
      this.groups.set(groups);
      this.applyFilter();
    });
  }

  private applyFilter(): void {
    const term = this.searchTerm().toLowerCase().trim();
    const all = this.groups();

    if (!term) {
      this.filteredGroups.set(all);
      return;
    }

    this.filteredGroups.set(
      all.filter(
        (g: GroupResponse) =>
          g.name.toLowerCase().includes(term),
      ),
    );
  }
}
