// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faClockRotateLeft,
  faPenToSquare,
  faImage,
  faArrowsRotate,
  faPlus,
  faUser,
  faCircleCheck,
  faCalendarDays,
  type IconDefinition,
} from '@fortawesome/free-solid-svg-icons';
import { type IconProp } from '@fortawesome/fontawesome-svg-core';
import { type DocumentHistoryEntry, type DocumentHistoryType } from '../../../services/document-history.service';

// --------------------------------------------------------------------------
// CONFIG: etiquetas e iconos por tipo de cambio
// --------------------------------------------------------------------------
const CHANGE_TYPE_CONFIG: Record<
  DocumentHistoryType,
  { label: string; icon: IconDefinition }
> = {
  CREATED:        { label: 'Documento creado',             icon: faPlus },
  UPDATED:        { label: 'Actualización de datos',       icon: faPenToSquare },
  IMAGE_UPLOADED: { label: 'Actualización de imagen',      icon: faImage },
  RENEWED:        { label: 'Renovación de caducidad',      icon: faArrowsRotate },
  DATES_UPDATED:  { label: 'Actualización de fechas',      icon: faCalendarDays },
};

/**
 * Componente que renderiza el historial de cambios de un documento
 * como una línea temporal vertical, con icono y etiqueta específicos
 * por tipo de cambio (creado, actualizado, renovado, etc.).
 */
@Component({
  selector: 'app-version-history',
  imports: [FaIconComponent],
  templateUrl: './version-history.html',
  styleUrl: './version-history.scss',
})
export class VersionHistoryComponent {
  /** Lista de entradas del historial ordenadas cronológicamente. */
  entries = input.required<DocumentHistoryEntry[]>();

  protected readonly faClockRotateLeft = faClockRotateLeft;
  protected readonly faUser = faUser;
  protected readonly faCircleCheck = faCircleCheck;

  /** Devuelve la etiqueta legible asociada a un tipo de cambio. */
  protected getChangeLabel(type: DocumentHistoryType): string {
    return CHANGE_TYPE_CONFIG[type]?.label ?? type;
  }

  /** Devuelve el icono asociado a un tipo de cambio. */
  protected getChangeIcon(type: DocumentHistoryType): IconProp {
    return CHANGE_TYPE_CONFIG[type]?.icon ?? faPenToSquare;
  }

  /** Formatea una fecha ISO en formato español con hora. */
  protected formatDateTime(dateTime: string): string {
    const date = new Date(dateTime);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
}
