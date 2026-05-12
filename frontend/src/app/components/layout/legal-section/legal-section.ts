// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --------------------------------------------------------------------------
// COMPONENTE: LEGAL SECTION
// --------------------------------------------------------------------------

/**
 * Bloque de una página legal. Renderiza una cabecera con icono, número y
 * título, y proyecta el contenido del bloque vía `<ng-content/>`.
 * El atributo `id` permite enlazar la sección desde el índice de la
 * página (TOC) generado por `LegalLayoutComponent`.
 */
@Component({
  selector: 'app-legal-section',
  imports: [FaIconComponent],
  templateUrl: './legal-section.html',
  styleUrl: './legal-section.scss',
})
export class LegalSectionComponent {
  /** Identificador único usado como ancla `#id`. */
  sectionId = input.required<string>();
  /** Título corto que aparece en la cabecera. */
  title = input.required<string>();
  /** Icono Font Awesome mostrado en el badge de la cabecera. */
  icon = input.required<IconDefinition>();
}
