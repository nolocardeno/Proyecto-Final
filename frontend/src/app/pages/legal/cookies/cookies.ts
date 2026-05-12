// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  faCircleInfo,
  faCircleNodes,
  faCookieBite,
  faHardDrive,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { LegalLayoutComponent, LegalTocItem } from '../../../components/layout/legal-layout/legal-layout';
import { LegalSectionComponent } from '../../../components/layout/legal-section/legal-section';
import { ButtonComponent } from '../../../components/shared/button/button';
import { CookieConsentService } from '../../../services/cookie-consent.service';

// --------------------------------------------------------------------------
// PÁGINA: POLÍTICA DE COOKIES
// --------------------------------------------------------------------------
@Component({
  selector: 'app-cookies',
  imports: [RouterLink, LegalLayoutComponent, LegalSectionComponent, ButtonComponent],
  templateUrl: './cookies.html',
  styleUrl: './cookies.scss',
})
export class CookiesComponent {
  /** Servicio de consentimiento (público para usarlo en plantilla). */
  protected readonly consent = inject(CookieConsentService);
  /** Fecha mostrada en la cabecera del documento legal. */
  protected readonly updatedAt = '12 de mayo de 2026';
  /** Icono mostrado en la cabecera (hero). */
  protected readonly heroIcon = faCookieBite;

  // --- Iconos por sección ---
  protected readonly faSummary = faCircleInfo;
  protected readonly faStorage = faHardDrive;
  protected readonly faThirdParty = faCircleNodes;
  protected readonly faConsent = faSliders;
  protected readonly faMore = faCookieBite;

  /** Índice navegable de la página, consumido por `LegalLayoutComponent`. */
  protected readonly sections: LegalTocItem[] = [
    { id: 'summary', title: 'Resumen', icon: this.faSummary },
    { id: 'storage', title: 'Qué guardamos', icon: this.faStorage },
    { id: 'third-party', title: 'Terceros', icon: this.faThirdParty },
    { id: 'consent', title: 'Gestionar consentimiento', icon: this.faConsent },
    { id: 'more', title: 'Más información', icon: this.faMore },
  ];
}

