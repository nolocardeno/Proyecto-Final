// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, effect, input, output, signal } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { FilePickerComponent } from '../../shared/file-picker/file-picker';

// --------------------------------------------------------------------------
// COMPONENTE: AVATAR UPLOAD CARD (Cambio de imagen de usuario)
// --------------------------------------------------------------------------

/**
 * Tarjeta para cambiar la imagen de perfil. Muestra el avatar actual y
 * un `FilePickerComponent` que captura el archivo y lo emite al padre.
 * Usa un `effect` para resetear el flag de error cada vez que cambia
 * la URL externa.
 */
@Component({
  selector: 'app-avatar-upload-card',
  imports: [FilePickerComponent, FaIconComponent],
  templateUrl: './avatar-upload-card.html',
  styleUrl: './avatar-upload-card.scss',
})
export class AvatarUploadCardComponent {
  /** URL del avatar actual del usuario. */
  imageUrl = input('');

  /** Emite el archivo seleccionado por el usuario. */
  fileSelected = output<File>();

  protected readonly faUser = faUser;
  protected readonly imageError = signal(false);

  constructor() {
    // Si la URL cambia (p. ej. tras subir un nuevo avatar), reintentar.
    effect(() => {
      this.imageUrl();
      this.imageError.set(false);
    });
  }

  /** Manejador del evento `error` de la imagen: muestra el icono fallback. */
  protected onImageError(): void {
    this.imageError.set(true);
  }
}
