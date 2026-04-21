import { Component, input, output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faBell, faTrash } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-alert-button',
  imports: [FaIconComponent],
  templateUrl: './alert-button.html',
  styleUrl: './alert-button.scss',
})
export class AlertButtonComponent {
  days = input.required<number>();
  active = input<boolean>(false);
  /** When true, shows a delete-on-hover overlay instead of a toggle behaviour */
  deletable = input<boolean>(false);

  toggle = output<number>();
  delete = output<number>();

  protected readonly faBell = faBell;
  protected readonly faTrash = faTrash;

  protected onClick(): void {
    if (this.deletable()) {
      this.delete.emit(this.days());
    } else {
      this.toggle.emit(this.days());
    }
  }
}
