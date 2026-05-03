// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { type GroupMember } from '../../../models/group.model';

// --------------------------------------------------------------------------
// COMPONENTE: AVATAR STACK
// Muestra avatares solapados de miembros con desbordamiento "+N"
// --------------------------------------------------------------------------

/**
 * Pila de avatares para mostrar miembros de un grupo de forma compacta.
 * Calcula reactivamente con `computed()` qué miembros mostrar y cuántos
 * quedan ocultos («desbordamiento +N»).
 */
@Component({
  selector: 'app-avatar-stack',
  imports: [FaIconComponent],
  templateUrl: './avatar-stack.html',
  styleUrl: './avatar-stack.scss',
})
export class AvatarStackComponent {
  /** Lista de miembros con datos disponibles. */
  members = input<GroupMember[]>([]);
  /** Número total de miembros del grupo (puede superar `members.length`). */
  totalCount = input.required<number>();
  /** Número máximo de avatares a renderizar antes de mostrar «+N». */
  maxVisible = input<number>(3);

  protected readonly faUser = faUser;

  /** Genera un slot por cada miembro visible, con datos reales si están disponibles. */
  protected readonly avatarSlots = computed(() => {
    const real = this.members();
    const count = Math.min(this.totalCount(), this.maxVisible());
    return Array.from({ length: count }, (_, i) => real[i] ?? null);
  });

  /** Número de miembros que no caben en la pila (etiqueta «+N»). */
  protected readonly overflowCount = computed(() =>
    Math.max(0, this.totalCount() - this.maxVisible()),
  );
}
