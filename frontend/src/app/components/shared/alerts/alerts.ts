// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject } from '@angular/core';
import { AlertService } from '../../../services/alert.service';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCircleCheck,
  faCircleXmark,
  faTriangleExclamation,
  faCircleInfo,
  faXmark,
} from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: ALERTS CONTAINER
// --------------------------------------------------------------------------

/**
 * Contenedor global de notificaciones (toasts). Renderiza la lista
 * reactiva de alertas expuesta por `AlertService` y permite cerrarlas
 * manualmente.
 */
@Component({
  selector: 'app-alerts',
  imports: [FaIconComponent],
  templateUrl: './alerts.html',
  styleUrl: './alerts.scss',
})
export class AlertsComponent {
  protected readonly alertService = inject(AlertService);

  /** Mapa tipo → icono FontAwesome. */
  protected readonly icons = {
    success: faCircleCheck,
    error: faCircleXmark,
    warning: faTriangleExclamation,
    info: faCircleInfo,
  };

  protected readonly faXmark = faXmark;
}
