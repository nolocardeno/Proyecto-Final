// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SidebarComponent, type SidebarPage } from '../../components/layout/sidebar/sidebar';
import { GroupCardComponent } from '../../components/shared/group-card/group-card';
import { PageHeaderComponent } from '../../components/shared/page-header/page-header';
import { ButtonComponent } from '../../components/shared/button/button';
import { SearchBarComponent } from '../../components/shared/search-bar/search-bar';
import { CreateGroupModalComponent } from '../../components/shared/create-group-modal/create-group-modal';
import { GroupService } from '../../services/group.service';
import { GroupModalService } from '../../services/group-modal.service';
import { AuthService } from '../../services/auth.service';
import { type GroupResponse } from '../../models/group.model';

// --------------------------------------------------------------------------
// PÁGINA: GROUPS
// --------------------------------------------------------------------------
@Component({
  selector: 'app-groups',
  imports: [
    SidebarComponent,
    GroupCardComponent,
    PageHeaderComponent,
    ButtonComponent,
    SearchBarComponent,
    CreateGroupModalComponent,
  ],
  templateUrl: './groups.html',
  styleUrl: './groups.scss',
})
export class GroupsComponent implements OnInit {
  private readonly groupService = inject(GroupService);
  protected readonly groupModal = inject(GroupModalService);
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly currentPage = signal<SidebarPage>('Groups');
  protected readonly groups = signal<GroupResponse[]>([]);
  protected readonly searchTerm = signal('');

  protected readonly filteredGroups = signal<GroupResponse[]>([]);

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

  protected onViewDocuments(groupId: number): void {
    // TODO: Navegar a documentos del grupo
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
