// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, effect, input, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: USER CARD (Profile photo + name + subtitle)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-user-card',
  imports: [FaIconComponent],
  templateUrl: './user-card.html',
  styleUrl: './user-card.scss',
})
export class UserCardComponent {
  username = input.required<string>();
  subtitle = input<string>('');
  photoUrl = input<string>('');
  variant = input<'default' | 'header'>('default');

  protected readonly faUser = faUser;
  protected readonly imageError = signal(false);

  constructor() {
    effect(() => {
      this.photoUrl();
      this.imageError.set(false);
    });
  }

  protected onImageError(): void {
    this.imageError.set(true);
  }
}
