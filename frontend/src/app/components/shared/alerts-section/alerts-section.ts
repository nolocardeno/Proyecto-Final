import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBell, faBellSlash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button';
import { AlertButtonComponent } from '../alert-button/alert-button';
import { type DocumentAlertResponse } from '../../../services/document-alert.service';

// --------------------------------------------------------------------------
// COMPONENTE: ALERTS SECTION (Configuración de alertas de un documento)
// --------------------------------------------------------------------------

/**
 * Sección con la configuración de alertas de caducidad de un
 * documento: presets rápidos, lista de alertas activas y formulario
 * para añadir alertas personalizadas (`ngModel`).
 */
@Component({
  selector: 'app-alerts-section',
  imports: [FaIconComponent, ButtonComponent, AlertButtonComponent, FormsModule],
  templateUrl: './alerts-section.html',
  styleUrl: './alerts-section.scss',
})
export class AlertsSectionComponent {
  /** Indica si el documento tiene fecha de caducidad. */
  hasExpiryDate = input.required<boolean>();
  /** Lista de presets rápidos en días. */
  presetDays = input<readonly number[]>([1, 7, 30]);
  /** Alertas preset actualmente activas. */
  activeAlerts = input<DocumentAlertResponse[]>([]);
  /** Alertas personalizadas añadidas por el usuario. */
  customAlerts = input<DocumentAlertResponse[]>([]);
  /** Modelo del input de días personalizado. */
  customDays = '';

  /** Emitido al activar/desactivar una alerta preset. */
  toggleAlert = output<number>();
  /** Emitido al añadir una alerta personalizada. */
  addCustomAlert = output<number>();
  /** Emitido al eliminar una alerta. */
  deleteAlert = output<DocumentAlertResponse>();

  protected readonly faBell = faBell;
  protected readonly faBellSlash = faBellSlash;
  protected readonly faPlus = faPlus;

  /** Indica si existe una alerta activa para los días indicados. */
  protected isActive(days: number): boolean {
    return this.activeAlerts().some((a) => a.daysBeforeExpiry === days);
  }

  /** Procesa el envío del formulario para añadir una alerta personalizada. */
  protected onSubmit(): void {
    const days = parseInt(this.customDays, 10);
    if (!isNaN(days) && days >= 1) {
      this.addCustomAlert.emit(days);
      this.customDays = '';
    }
  }
}
