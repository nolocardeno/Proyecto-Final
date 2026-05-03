// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

// --------------------------------------------------------------------------
// COMPONENTE: OPTION BUTTON (Botón de selección con icono reutilizable)
// --------------------------------------------------------------------------

/**
 * Botón de tipo «opción» usado en flujos paso-a-paso (modales). Muestra
 * un icono y una etiqueta y emite `selected` al hacer clic.
 */
@Component({
  selector: 'app-option-button',
  imports: [FaIconComponent],
  templateUrl: './option-button.html',
  styleUrl: './option-button.scss',
})
export class OptionButtonComponent {
  /** Icono FontAwesome a renderizar. */
  icon = input.required<IconDefinition>();
  /** Etiqueta de texto debajo del icono. */
  label = input.required<string>();
  /** Marca el botón como seleccionado. */
  active = input(false);

  /** Emitido cuando el usuario selecciona la opción. */
  selected = output<void>();
}
