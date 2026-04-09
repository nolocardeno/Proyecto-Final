// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, input } from '@angular/core';

// --------------------------------------------------------------------------
// COMPONENTE: BUTTON (Reutilizable)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss',
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary' | 'ghost' | 'text' | 'icon' | 'card'>('primary');
  size = input<'sm' | 'md' | 'lg' | 'auth' | 'cta' | 'full'>('md');
  type = input<'button' | 'submit'>('button');
  disabled = input<boolean>(false);
}
