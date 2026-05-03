// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, model } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFolder,
  faTicket,
  faFileLines,
  faClock,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

// --------------------------------------------------------------------------
// TIPOS Y CONSTANTES
// --------------------------------------------------------------------------

/** Categorías disponibles para filtrar el listado de documentos. */
export type FilterType = 'all' | 'tickets' | 'documents' | 'expired';

/** Configuración visual asociada a cada filtro. */
interface FilterConfig {
  type: FilterType;
  label: string;
  icon: IconDefinition;
}

/** Lista de filtros mostrados en la barra. */
const FILTERS: FilterConfig[] = [
  { type: 'all', label: 'TODOS', icon: faFolder },
  { type: 'tickets', label: 'TICKETS', icon: faTicket },
  { type: 'documents', label: 'DOCUMENTOS', icon: faFileLines },
  { type: 'expired', label: 'EXPIRADOS', icon: faClock },
];

// --------------------------------------------------------------------------
// COMPONENTE: FILTER BAR
// --------------------------------------------------------------------------

/**
 * Barra de filtros con contadores. El filtro activo se expone mediante
 * un `model()` (two-way binding) que el componente padre puede leer y
 * escribir.
 */
@Component({
  selector: 'app-filter-bar',
  imports: [FaIconComponent],
  templateUrl: './filter-bar.html',
  styleUrl: './filter-bar.scss',
})
export class FilterBarComponent {
  /** Mapa con el número de elementos en cada categoría. */
  counts = input.required<Record<FilterType, number>>();
  /** Filtro actualmente seleccionado (two-way binding). */
  activeFilter = model<FilterType>('all');
  /** Variante visual: por defecto o compacta. */
  size = input<'default' | 'compact'>('default');

  protected readonly filters = FILTERS;

  /** Actualiza el filtro activo al hacer clic en una de las opciones. */
  protected selectFilter(type: FilterType): void {
    this.activeFilter.set(type);
  }
}
