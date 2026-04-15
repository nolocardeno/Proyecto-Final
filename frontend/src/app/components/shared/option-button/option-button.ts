// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --------------------------------------------------------------------------
// COMPONENTE: OPTION BUTTON (Botón de selección con icono reutilizable)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-option-button',
  imports: [FaIconComponent],
  templateUrl: './option-button.html',
  styleUrl: './option-button.scss',
})
export class OptionButtonComponent {
  icon = input.required<IconDefinition>();
  label = input.required<string>();
  active = input(false);

  selected = output<void>();
}
