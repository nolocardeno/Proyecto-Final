// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, input } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { AlertService } from '../../../services/alert.service';

// --------------------------------------------------------------------------
// COMPONENTE: COPY BUTTON (Botón reutilizable para copiar texto)
// --------------------------------------------------------------------------
@Component({
  selector: 'app-copy-button',
  imports: [FaIconComponent],
  templateUrl: './copy-button.html',
  styleUrl: './copy-button.scss',
})
export class CopyButtonComponent {
  private readonly alert = inject(AlertService);

  textToCopy = input.required<string>();
  ariaLabel = input<string>('Copiar al portapapeles');
  successMessage = input<string>('Copiado al portapapeles');

  protected readonly faCopy = faCopy;

  protected copy(): void {
    navigator.clipboard.writeText(this.textToCopy()).then(() => {
      this.alert.show('success', this.successMessage());
    });
  }
}
