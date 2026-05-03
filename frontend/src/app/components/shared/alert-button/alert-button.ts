// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBell, faTrash } from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: ALERT BUTTON
// --------------------------------------------------------------------------

/**
 * Botón con icono de campana usado para gestionar alertas de caducidad.
 *
 * Tiene dos comportamientos según la propiedad `deletable`:
 *  - Modo toggle: emite `toggle` con el número de días al hacer clic.
 *  - Modo eliminar: muestra un overlay con icono de papelera y emite
 *    `delete` cuando el usuario confirma la acción.
 */
@Component({
  selector: 'app-alert-button',
  imports: [FaIconComponent],
  templateUrl: './alert-button.html',
  styleUrl: './alert-button.scss',
})
export class AlertButtonComponent {
  /** Días previos a la caducidad asociados al botón. */
  days = input.required<number>();
  /** Marca el botón como activo (alerta ya configurada). */
  active = input<boolean>(false);
  /** Si es `true`, el botón actúa en modo eliminar en lugar de toggle. */
  deletable = input<boolean>(false);

  /** Emite el número de días cuando el usuario activa/desactiva la alerta. */
  toggle = output<number>();
  /** Emite el número de días cuando el usuario solicita borrar la alerta. */
  delete = output<number>();

  protected readonly faBell = faBell;
  protected readonly faTrash = faTrash;

  /** Manejador del evento `click`: delega en `delete` o `toggle` según el modo. */
  protected onClick(): void {
    if (this.deletable()) {
      this.delete.emit(this.days());
    } else {
      this.toggle.emit(this.days());
    }
  }
}
