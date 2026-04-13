// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CopyButtonComponent } from '../copy-button/copy-button';
import { FormFieldComponent } from '../form-field/form-field';

// --------------------------------------------------------------------------
// COMPONENTE: GROUP CODE CARD (Código de acceso del grupo con botón copiar)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-group-code-card',
  imports: [CopyButtonComponent, FormFieldComponent, FormsModule],
  templateUrl: './group-code-card.html',
  styleUrl: './group-code-card.scss',
})
export class GroupCodeCardComponent {
  accessCode = input.required<string>();
}
