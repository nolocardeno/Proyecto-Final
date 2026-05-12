// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../button/button';
import { CookieConsentService } from '../../../services/cookie-consent.service';

// --------------------------------------------------------------------------
// COMPONENTE: COOKIE BANNER
// --------------------------------------------------------------------------

/**
 * Aviso de cookies fijo en la parte inferior de la pantalla.
 *
 * Se muestra mientras el usuario no haya aceptado o rechazado el uso de
 * almacenamientos opcionales. Como Scantral no carga scripts de terceros
 * ni analítica, la decisión solo afecta a los almacenamientos no
 * esenciales gestionados por la propia aplicación (p. ej. el email
 * recordado en el formulario de login).
 */
@Component({
  selector: 'app-cookie-banner',
  imports: [RouterLink, ButtonComponent],
  templateUrl: './cookie-banner.html',
  styleUrl: './cookie-banner.scss',
})
export class CookieBannerComponent {
  /** Servicio de consentimiento (público para usarlo en plantilla). */
  protected readonly consent = inject(CookieConsentService);
}
