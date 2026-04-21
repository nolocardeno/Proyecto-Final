import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCalendarDays, faDownload } from '@fortawesome/free-solid-svg-icons';
import { faGoogle } from '@fortawesome/free-brands-svg-icons';
import { ExportButtonComponent } from '../export-button/export-button';

@Component({
  selector: 'app-export-section',
  imports: [FaIconComponent, ExportButtonComponent],
  templateUrl: './export-section.html',
  styleUrl: './export-section.scss',
})
export class ExportSectionComponent {
  hasExpiryDate = input.required<boolean>();

  openGoogle = output<void>();
  openOutlook = output<void>();
  downloadIcs = output<void>();

  protected readonly faCalendarDays = faCalendarDays;
  protected readonly faDownload = faDownload;
  protected readonly faGoogle = faGoogle;
}
