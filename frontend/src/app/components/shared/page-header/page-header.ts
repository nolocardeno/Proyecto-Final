// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: PAGE HEADER (Barra de encabezado de página)
// --------------------------------------------------------------------------

/**
 * Cabecera reutilizable de página con título y subtítulo opcional.
 */
@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeaderComponent {
  /** Título principal de la página. */
  title = input.required<string>();
  /** Subtítulo opcional. */
  subtitle = input<string>();
}
