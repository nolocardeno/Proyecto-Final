import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBell, faBellSlash, faPlus } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '../button/button';
import { AlertButtonComponent } from '../alert-button/alert-button';
import { type DocumentAlertResponse } from '../../../services/document-alert.service';

@Component({
  selector: 'app-alerts-section',
  imports: [FaIconComponent, ButtonComponent, AlertButtonComponent, FormsModule],
  templateUrl: './alerts-section.html',
  styleUrl: './alerts-section.scss',
})
export class AlertsSectionComponent {
  hasExpiryDate = input.required<boolean>();
  presetDays = input<readonly number[]>([1, 7, 30]);
  activeAlerts = input<DocumentAlertResponse[]>([]);
  customAlerts = input<DocumentAlertResponse[]>([]);
  customDays = '';

  toggleAlert = output<number>();
  addCustomAlert = output<number>();
  deleteAlert = output<DocumentAlertResponse>();

  protected readonly faBell = faBell;
  protected readonly faBellSlash = faBellSlash;
  protected readonly faPlus = faPlus;

  protected isActive(days: number): boolean {
    return this.activeAlerts().some((a) => a.daysBeforeExpiry === days);
  }

  protected onSubmit(): void {
    const days = parseInt(this.customDays, 10);
    if (!isNaN(days) && days >= 1) {
      this.addCustomAlert.emit(days);
      this.customDays = '';
    }
  }
}
