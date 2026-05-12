// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  faClockRotateLeft,
  faEnvelope,
  faFileContract,
  faGavel,
  faScaleBalanced,
  faServer,
  faShieldHalved,
  faUpload,
  faUser,
} from '@fortawesome/free-solid-svg-icons';
import { LegalLayoutComponent, LegalTocItem } from '../../../components/layout/legal-layout/legal-layout';
import { LegalSectionComponent } from '../../../components/layout/legal-section/legal-section';

// --------------------------------------------------------------------------
// PÁGINA: TÉRMINOS Y CONDICIONES
// --------------------------------------------------------------------------
@Component({
  selector: 'app-terms',
  imports: [RouterLink, LegalLayoutComponent, LegalSectionComponent],
  templateUrl: './terms.html',
  styleUrl: './terms.scss',
})
export class TermsComponent {
  /** Fecha mostrada en la cabecera del documento legal. */
  protected readonly updatedAt = '12 de mayo de 2026';
  /** Icono mostrado en la cabecera (hero). */
  protected readonly heroIcon = faFileContract;

  // --- Iconos por sección (también referenciados desde el TOC) ---
  protected readonly faAbout = faFileContract;
  protected readonly faAccount = faUser;
  protected readonly faContent = faUpload;
  protected readonly faModeration = faGavel;
  protected readonly faAvailability = faServer;
  protected readonly faLiability = faShieldHalved;
  protected readonly faPrivacy = faClockRotateLeft;
  protected readonly faContact = faEnvelope;
  protected readonly faLaw = faScaleBalanced;

  /** Índice navegable de la página, consumido por `LegalLayoutComponent`. */
  protected readonly sections: LegalTocItem[] = [
    { id: 'about', title: 'De qué va Scantral', icon: this.faAbout },
    { id: 'account', title: 'Tu cuenta', icon: this.faAccount },
    { id: 'content', title: 'Contenido que subes', icon: this.faContent },
    { id: 'moderation', title: 'Moderación', icon: this.faModeration },
    { id: 'availability', title: 'Disponibilidad', icon: this.faAvailability },
    { id: 'liability', title: 'Responsabilidad', icon: this.faLiability },
    { id: 'privacy', title: 'Privacidad y cookies', icon: this.faPrivacy },
    { id: 'law', title: 'Ley aplicable', icon: this.faLaw },
  ];
}

