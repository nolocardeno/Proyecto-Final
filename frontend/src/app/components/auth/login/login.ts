// --------------------------------------------------------------------------
// IMPORTS
// --------------------------------------------------------------------------
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthCardComponent } from '../../shared/auth-card/auth-card';
import { ButtonComponent } from '../../shared/button/button';
import { FormFieldComponent } from '../../shared/form-field/form-field';
import { FormCheckboxComponent } from '../../shared/form-checkbox/form-checkbox';
import { AuthService } from '../../../services/auth.service';
import { AuthModalService } from '../../../services/auth-modal.service';
import { AlertService } from '../../../services/alert.service';

// --------------------------------------------------------------------------
// COMPONENTE: MODAL LOGIN
// --------------------------------------------------------------------------

/**
 * Modal de inicio de sesión.
 *
 * Características DWEC más relevantes:
 *  - Reactive Forms con validadores predefinidos `Validators.required`
 *    y `Validators.email`.
 *  - Captura del evento `submit` del formulario y validación previa.
 *  - Persistencia opcional del email mediante `localStorage`
 *    («recuérdame»).
 *  - Comunicación asíncrona con el backend a través del `AuthService`
 *    (Observable de RxJS) y manejo de éxito/error con `subscribe`.
 */
@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    AuthCardComponent,
    ButtonComponent,
    FormFieldComponent,
    FormCheckboxComponent,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly authModal = inject(AuthModalService);
  private readonly alert = inject(AlertService);

  /** Clave en `localStorage` donde se guarda el email recordado. */
  private readonly REMEMBER_ME_KEY = 'scantral_remembered_email';

  /** Indica si hay una petición de login en curso (deshabilita el botón). */
  protected loading = false;

  /** Formulario reactivo con los validadores predefinidos del lenguaje. */
  protected readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  /** Si existía un email recordado, lo precarga en el formulario. */
  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem(this.REMEMBER_ME_KEY);
    if (rememberedEmail) {
      this.loginForm.patchValue({ email: rememberedEmail, rememberMe: true });
    }
  }

  /**
   * Manejador del evento `submit`. Valida el formulario, llama al servicio
   * de autenticación y reacciona a éxito/error mostrando una alerta.
   */
  protected onSubmit(): void {
    if (!this.loginForm.valid || this.loading) return;

    this.loading = true;
    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        // Guarda u olvida el email según el checkbox «recuérdame».
        if (rememberMe) {
          localStorage.setItem(this.REMEMBER_ME_KEY, email!);
        } else {
          localStorage.removeItem(this.REMEMBER_ME_KEY);
        }
        this.alert.show('success', `¡Bienvenido, ${res.name}!`);
        this.authModal.close();
        this.router.navigate(['/dashboard']);
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        const mensaje = err.error?.error ?? 'No se pudo iniciar sesión. Inténtalo de nuevo';
        this.alert.show('error', mensaje);
        this.loading = false;
      },
    });
  }
}
