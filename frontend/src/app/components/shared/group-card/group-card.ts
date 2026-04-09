// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUsers, faFileLines } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button';

// --------------------------------------------------------------------------
// COMPONENTE: GROUP CARD
// --------------------------------------------------------------------------
@Component({
  selector: 'app-group-card',
  imports: [FaIconComponent, ButtonComponent],
  templateUrl: './group-card.html',
  styleUrl: './group-card.scss',
})
export class GroupCardComponent {
  name = input.required<string>();
  memberCount = input.required<number>();
  documentCount = input.required<number>();

  viewDocuments = output<void>();

  // --- Iconos Font Awesome ---
  protected readonly faUsers = faUsers;
  protected readonly faFileLines = faFileLines;

  protected onViewDocuments(): void {
    this.viewDocuments.emit();
  }
}
