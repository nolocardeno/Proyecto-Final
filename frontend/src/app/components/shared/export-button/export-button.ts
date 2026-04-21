import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-export-button',
  imports: [FaIconComponent],
  templateUrl: './export-button.html',
  styleUrl: './export-button.scss',
})
export class ExportButtonComponent {
  icon = input.required<IconDefinition>();
  name = input.required<string>();
  description = input.required<string>();
  ariaLabel = input.required<string>();

  action = output<void>();

  protected readonly faCalendarPlus = faCalendarPlus;
}
