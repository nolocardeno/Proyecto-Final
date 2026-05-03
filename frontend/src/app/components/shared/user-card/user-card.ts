// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, effect, input, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: USER CARD (Profile photo + name + subtitle)
// --------------------------------------------------------------------------

/**
 * Tarjeta genérica de usuario con foto, nombre y subtítulo opcional.
 * Si la imagen no carga, se muestra un icono fallback gracias a un
 * `effect` que resetea `imageError` cada vez que cambia `photoUrl`.
 */
@Component({
  selector: 'app-user-card',
  imports: [FaIconComponent],
  templateUrl: './user-card.html',
  styleUrl: './user-card.scss',
})
export class UserCardComponent {
  /** Nombre del usuario. */
  username = input.required<string>();
  /** Subtítulo opcional (rol, email…). */
  subtitle = input<string>('');
  /** URL de la foto de perfil. */
  photoUrl = input<string>('');
  /** Variante visual: 'default' o 'header'. */
  variant = input<'default' | 'header'>('default');

  protected readonly faUser = faUser;
  /** Indica si la imagen no se ha podido cargar. */
  protected readonly imageError = signal(false);

  constructor() {
    // Cuando cambia la URL, reintentar la carga.
    effect(() => {
      this.photoUrl();
      this.imageError.set(false);
    });
  }

  /** Manejador del evento `error` de la imagen. */
  protected onImageError(): void {
    this.imageError.set(true);
  }
}
