// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown, faUsers } from '@fortawesome/free-solid-svg-icons';
import { UserCardComponent } from '../user-card/user-card';
import { type GroupMember } from '../../../models/group.model';

// --------------------------------------------------------------------------
// COMPONENTE: GROUP MEMBERS CARD (Lista de miembros del grupo)
// --------------------------------------------------------------------------

/**
 * Tarjeta que renderiza la lista de miembros del grupo. El creador del
 * grupo se identifica con un icono de corona.
 */
@Component({
  selector: 'app-group-members-card',
  imports: [UserCardComponent, FaIconComponent],
  templateUrl: './group-members-card.html',
  styleUrl: './group-members-card.scss',
})
export class GroupMembersCardComponent {
  /** Lista de miembros del grupo. */
  members = input.required<GroupMember[]>();
  /** Id del usuario creador del grupo. */
  creatorId = input.required<number>();

  protected readonly faCrown = faCrown;
  protected readonly faUsers = faUsers;

  /** Devuelve la URL del avatar de un miembro a partir de su id. */
  protected getProfileImageUrl(userId: number): string {
    return `/api/users/${userId}/profile-image`;
  }
}
