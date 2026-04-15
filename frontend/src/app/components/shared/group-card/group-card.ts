// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUsers, faUser, faFileLines, faHourglassHalf, faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { AvatarStackComponent } from '../avatar-stack/avatar-stack';
import { ProgressBarComponent } from '../progress-bar/progress-bar';
import { type GroupMember } from '../../../models/group.model';

// --------------------------------------------------------------------------
// COMPONENTE: GROUP CARD
// --------------------------------------------------------------------------
@Component({
  selector: 'app-group-card',
  imports: [FaIconComponent, AvatarStackComponent, ProgressBarComponent],
  templateUrl: './group-card.html',
  styleUrl: './group-card.scss',
})
export class GroupCardComponent {
  name = input.required<string>();
  memberCount = input.required<number>();
  documentCount = input.required<number>();
  activeDocumentCount = input<number>(0);
  expiredDocumentCount = input<number>(0);
  members = input<GroupMember[]>([]);

  viewDocuments = output<void>();

  // --- Iconos Font Awesome ---
  protected readonly faUsers = faUsers;
  protected readonly faUser = faUser;
  protected readonly faFileLines = faFileLines;
  protected readonly faHourglassHalf = faHourglassHalf;
  protected readonly faCircleXmark = faCircleXmark;

  protected readonly progressValue = computed(() => {
    const total = this.documentCount();
    if (total === 0) return 0;
    return Math.round((this.activeDocumentCount() / total) * 100);
  });

  protected onClick(): void {
    this.viewDocuments.emit();
  }
}
