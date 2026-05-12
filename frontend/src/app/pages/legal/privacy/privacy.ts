// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  faBullseye,
  faCircleInfo,
  faClockRotateLeft,
  faCookieBite,
  faDatabase,
  faIdCard,
  faUserCheck,
  faUserShield,
  faUsersGear,
} from '@fortawesome/free-solid-svg-icons';
import { LegalLayoutComponent, LegalTocItem } from '../../../components/layout/legal-layout/legal-layout';
import { LegalSectionComponent } from '../../../components/layout/legal-section/legal-section';

// --------------------------------------------------------------------------
// PÁGINA: POLÍTICA DE PRIVACIDAD
// --------------------------------------------------------------------------
@Component({
  selector: 'app-privacy',
  imports: [RouterLink, LegalLayoutComponent, LegalSectionComponent],
  templateUrl: './privacy.html',
  styleUrl: './privacy.scss',
})
export class PrivacyComponent {
  /** Fecha mostrada en la cabecera del documento legal. */
  protected readonly updatedAt = '12 de mayo de 2026';
  /** Icono mostrado en la cabecera (hero). */
  protected readonly heroIcon = faUserShield;

  // --- Iconos por sección ---
  protected readonly faSummary = faCircleInfo;
  protected readonly faResponsible = faIdCard;
  protected readonly faData = faDatabase;
  protected readonly faPurpose = faBullseye;
  protected readonly faAccess = faUsersGear;
  protected readonly faRetention = faClockRotateLeft;
  protected readonly faRights = faUserCheck;
  protected readonly faCookies = faCookieBite;

  /** Índice navegable de la página, consumido por `LegalLayoutComponent`. */
  protected readonly sections: LegalTocItem[] = [
    { id: 'summary', title: 'Lo importante', icon: this.faSummary },
    { id: 'responsible', title: 'Responsable', icon: this.faResponsible },
    { id: 'data', title: 'Qué datos tratamos', icon: this.faData },
    { id: 'purpose', title: 'Para qué los usamos', icon: this.faPurpose },
    { id: 'access', title: 'Quién accede', icon: this.faAccess },
    { id: 'retention', title: 'Conservación', icon: this.faRetention },
    { id: 'rights', title: 'Tus derechos', icon: this.faRights },
    { id: 'cookies', title: 'Cookies', icon: this.faCookies },
  ];
}

