import { Component, input, model } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFolder,
  faTicket,
  faFileLines,
  faClock,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

export type FilterType = 'all' | 'tickets' | 'documents' | 'expired';

interface FilterConfig {
  type: FilterType;
  label: string;
  icon: IconDefinition;
}

const FILTERS: FilterConfig[] = [
  { type: 'all', label: 'TODOS', icon: faFolder },
  { type: 'tickets', label: 'TICKETS', icon: faTicket },
  { type: 'documents', label: 'DOCUMENTOS', icon: faFileLines },
  { type: 'expired', label: 'EXPIRADOS', icon: faClock },
];

@Component({
  selector: 'app-filter-bar',
  imports: [FaIconComponent],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
})
export class FilterBarComponent {
  counts = input.required<Record<FilterType, number>>();
  activeFilter = model<FilterType>('all');
  size = input<'default' | 'compact'>('default');

  protected readonly filters = FILTERS;

  protected selectFilter(type: FilterType): void {
    this.activeFilter.set(type);
  }
}
