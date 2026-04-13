// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCrown } from '@fortawesome/free-solid-svg-icons';
import { UserCardComponent } from '../user-card/user-card';
import { type GroupMember } from '../../../models/group.model';

// --------------------------------------------------------------------------
// COMPONENTE: GROUP MEMBERS CARD (Lista de miembros del grupo)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-group-members-card',
  imports: [UserCardComponent, FaIconComponent],
  templateUrl: './group-members-card.html',
  styleUrl: './group-members-card.scss',
})
export class GroupMembersCardComponent {
  members = input.required<GroupMember[]>();
  creatorId = input.required<number>();

  protected readonly faCrown = faCrown;
}
