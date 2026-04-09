// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthCardComponent } from '../../shared/auth-card/auth-card';
import { ButtonComponent } from '../../shared/button/button';
import { FormFieldComponent } from '../../shared/form-field/form-field';
import { FormCheckboxComponent } from '../../shared/form-checkbox/form-checkbox';
import { GroupService } from '../../../services/group.service';
import { GroupModalService } from '../../../services/group-modal.service';
import { AlertService } from '../../../services/alert.service';

// --------------------------------------------------------------------------
// COMPONENTE: CREATE GROUP MODAL
// --------------------------------------------------------------------------
@Component({
  selector: 'app-create-group-modal',
  imports: [
    ReactiveFormsModule,
    AuthCardComponent,
    ButtonComponent,
    FormFieldComponent,
    FormCheckboxComponent,
  ],
  templateUrl: './create-group-modal.html',
  styleUrl: './create-group-modal.scss',
})
export class CreateGroupModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly groupService = inject(GroupService);
  private readonly groupModal = inject(GroupModalService);
  private readonly alert = inject(AlertService);

  groupCreated = output<void>();

  protected loading = false;

  protected readonly createForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(50)]],
    allCanAdd: [true],
    onlyCreatorCanAdd: [false],
  });

  protected onModalClosed(): void {
    this.groupModal.close();
  }

  protected onAllCanAddChange(): void {
    const allCanAdd = this.createForm.get('allCanAdd')!.value;
    if (allCanAdd) {
      this.createForm.get('onlyCreatorCanAdd')!.setValue(false, { emitEvent: false });
    }
  }

  protected onOnlyCreatorChange(): void {
    const onlyCreator = this.createForm.get('onlyCreatorCanAdd')!.value;
    if (onlyCreator) {
      this.createForm.get('allCanAdd')!.setValue(false, { emitEvent: false });
    }
  }

  protected onSubmit(): void {
    if (!this.createForm.valid || this.loading) return;

    this.loading = true;
    const { name, allCanAdd } = this.createForm.getRawValue();

    this.groupService.createGroup({ name: name!, allCanAddDocuments: allCanAdd! }).subscribe({
      next: () => {
        this.alert.show('success', 'Grupo creado correctamente');
        this.groupModal.close();
        this.groupCreated.emit();
        this.loading = false;
        this.createForm.reset({ name: '', allCanAdd: true, onlyCreatorCanAdd: false });
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.error ?? 'No se pudo crear el grupo. Inténtalo de nuevo';
        this.alert.show('error', mensaje);
        this.loading = false;
      },
    });
  }
}
