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

/**
 * Tarjeta que resume un grupo en el listado: muestra nombre, número
 * de miembros y documentos, una pila de avatares y una barra de
 * progreso con el porcentaje de documentos vigentes.
 */
@Component({
  selector: 'app-group-card',
  imports: [FaIconComponent, AvatarStackComponent, ProgressBarComponent],
  templateUrl: './group-card.html',
  styleUrl: './group-card.scss',
})
export class GroupCardComponent {
  /** Nombre del grupo. */
  name = input.required<string>();
  /** Número total de miembros. */
  memberCount = input.required<number>();
  /** Número total de documentos del grupo. */
  documentCount = input.required<number>();
  /** Número de documentos aún vigentes. */
  activeDocumentCount = input<number>(0);
  /** Número de documentos caducados. */
  expiredDocumentCount = input<number>(0);
  /** Subconjunto de miembros con datos disponibles para los avatares. */
  members = input<GroupMember[]>([]);

  /** Emitido cuando el usuario hace clic para abrir el grupo. */
  viewDocuments = output<void>();

  // --- Iconos Font Awesome ---
  protected readonly faUsers = faUsers;
  protected readonly faUser = faUser;
  protected readonly faFileLines = faFileLines;
  protected readonly faHourglassHalf = faHourglassHalf;
  protected readonly faCircleXmark = faCircleXmark;

  /** Porcentaje de documentos vigentes (0-100), calculado reactivamente. */
  protected readonly progressValue = computed(() => {
    const total = this.documentCount();
    if (total === 0) return 0;
    return Math.round((this.activeDocumentCount() / total) * 100);
  });

  /** Manejador del evento `click`: emite `viewDocuments` al padre. */
  protected onClick(): void {
    this.viewDocuments.emit();
  }
}
