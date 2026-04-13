// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthCardComponent } from '../../shared/auth-card/auth-card';
import { ButtonComponent } from '../../shared/button/button';
import { FormFieldComponent } from '../../shared/form-field/form-field';
import { GroupService } from '../../../services/group.service';
import { JoinGroupModalService } from '../../../services/join-group-modal.service';
import { AlertService } from '../../../services/alert.service';

// --------------------------------------------------------------------------
// COMPONENTE: JOIN GROUP MODAL
// --------------------------------------------------------------------------
@Component({
  selector: 'app-join-group-modal',
  imports: [
    ReactiveFormsModule,
    AuthCardComponent,
    ButtonComponent,
    FormFieldComponent,
  ],
  templateUrl: './join-group-modal.html',
  styleUrl: './join-group-modal.scss',
})
export class JoinGroupModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly joinGroupModal = inject(JoinGroupModalService);
  private readonly alert = inject(AlertService);

  groupJoined = output<void>();

  protected loading = false;

  protected readonly joinForm = this.fb.group({
    accessCode: ['', [Validators.required]],
  });

  protected onModalClosed(): void {
    this.joinGroupModal.close();
  }

  protected onSubmit(): void {
    if (!this.joinForm.valid || this.loading) return;

    this.loading = true;
    const { accessCode } = this.joinForm.getRawValue();

    this.groupService.joinGroup(accessCode!).subscribe({
      next: () => {
        this.alert.show('success', 'Te has unido al grupo correctamente');
        this.joinGroupModal.close();
        this.groupJoined.emit();
        this.loading = false;
        this.joinForm.reset({ accessCode: '' });
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.error ?? 'No se pudo unir al grupo. Inténtalo de nuevo';
        this.alert.show('error', mensaje);
        this.loading = false;
      },
    });
  }
}
