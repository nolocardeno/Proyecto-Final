// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faCalendarXmark,
  faCircleCheck,
  faCircleXmark,
  faFileLines,
  faLightbulb,
} from '@fortawesome/free-solid-svg-icons';
import type { DocumentType } from '../../../models/document.model';

// --------------------------------------------------------------------------
// CONSEJOS POR TIPO DE DOCUMENTO OFICIAL
// --------------------------------------------------------------------------
const DOCUMENT_TIPS: Partial<Record<DocumentType, string>> = {
  DNI: 'Algunos trámites exigen un DNI con al menos 3 meses de validez restante.',
  PASSPORT:
    'Muchos países requieren que el pasaporte tenga al menos 6 meses de validez para permitir la entrada.',
  DRIVING_LICENSE:
    'Conviene renovar el permiso de conducir al menos 1 mes antes de su caducidad para evitar quedarse sin él.',
  INSURANCE:
    'Verifica que la cobertura del seguro cubra todo el periodo del viaje o evento.',
  ITV:
    'Circular con la ITV caducada conlleva multa y posible inmovilización del vehículo.',
  OTHER:
    'Comprueba siempre las fechas exigidas por el trámite específico para el que necesites este documento.',
};

// --------------------------------------------------------------------------
// COMPONENTE: VALIDATOR RESULT CARD
// Versión reducida de DocumentCard centrada en validez para una fecha concreta.
// --------------------------------------------------------------------------

/**
 * Tarjeta de resultado del validador. Muestra de forma compacta si
 * un documento sigue siendo válido para una fecha concreta y, si el
 * tipo dispone de consejo asociado, lo añade en `tip`.
 */
@Component({
  selector: 'app-validator-result-card',
  imports: [FaIconComponent, RouterLink],
  templateUrl: './validator-result-card.html',
  styleUrl: './validator-result-card.scss',
})
export class ValidatorResultCardComponent {
  /** Id del documento (para el enlace al detalle). */
  documentId = input.required<number>();
  /** Tipo de documento (DNI, pasaporte…). */
  type = input.required<DocumentType>();
  /** Título del documento. */
  title = input.required<string>();
  /** Fecha de expiración formateada. */
  expiryDate = input.required<string>();
  /** Indica si el documento es válido para la fecha consultada. */
  isValid = input.required<boolean>();

  protected readonly faFileLines = faFileLines;
  protected readonly faCalendarXmark = faCalendarXmark;
  protected readonly faCircleCheck = faCircleCheck;
  protected readonly faCircleXmark = faCircleXmark;
  protected readonly faLightbulb = faLightbulb;

  /** Consejo asociado al tipo del documento (si existe). */
  protected readonly tip = computed(() => DOCUMENT_TIPS[this.type()] ?? null);
}
