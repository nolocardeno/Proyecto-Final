// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faGithub,
  faLinkedinIn,
  faInstagram,
  faXTwitter,
} from '@fortawesome/free-brands-svg-icons';

// --------------------------------------------------------------------------
// COMPONENTE: FOOTER
// --------------------------------------------------------------------------

/**
 * Pie de página global con redes sociales y año actual dinámico.
 * Soporta dos variantes: por defecto (centrada en la landing) y
 * `with-sidebar` (alineada a la derecha del contenido principal).
 */
@Component({
  selector: 'app-footer',
  imports: [RouterLink, FaIconComponent],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class FooterComponent {
  /** Variante visual del footer. */
  variant = input<'default' | 'with-sidebar'>('default');
  /** Año actual mostrado en el copyright. */
  readonly currentYear = new Date().getFullYear();

  // --- Iconos Font Awesome (solo los necesarios) ---
  readonly faGithub = faGithub;
  readonly faLinkedinIn = faLinkedinIn;
  readonly faInstagram = faInstagram;
  readonly faXTwitter = faXTwitter;
}
