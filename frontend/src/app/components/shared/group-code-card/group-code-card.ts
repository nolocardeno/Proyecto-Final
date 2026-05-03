// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { CopyButtonComponent } from '../copy-button/copy-button';
import { FormFieldComponent } from '../form-field/form-field';

// --------------------------------------------------------------------------
// COMPONENTE: GROUP CODE CARD (Código de acceso del grupo con botón copiar)
// --------------------------------------------------------------------------

/**
 * Tarjeta que muestra el código de acceso del grupo en un campo de
 * sólo lectura, junto a un `CopyButtonComponent` para copiarlo al
 * portapapeles del sistema.
 */
@Component({
  selector: 'app-group-code-card',
  imports: [FaIconComponent, CopyButtonComponent, FormFieldComponent, FormsModule],
  templateUrl: './group-code-card.html',
  styleUrl: './group-code-card.scss',
})
export class GroupCodeCardComponent {
  /** Código de acceso del grupo. */
  accessCode = input.required<string>();
  protected readonly faKey = faKey;
}
