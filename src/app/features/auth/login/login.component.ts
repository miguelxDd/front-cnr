import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService, ToastService } from '../../../core/services';
import { ApiResponse, LoginResponse } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule
  ],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="text-center mb-4">
          <i class="pi pi-box" style="font-size: 3rem; color: var(--primary-color)"></i>
          <h1 style="margin-top: 1rem; font-size: 1.5rem; font-weight: 600;">
            Sistema de Gestión
          </h1>
          <p style="color: var(--text-color-secondary); margin-top: 0.5rem;">
            Ingrese sus credenciales para continuar
          </p>
        </div>

        @if (errorMessage()) {
          <p-message 
            severity="error" 
            [text]="errorMessage()" 
            styleClass="w-full mb-3"
          />
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="mb-3">
            <label for="username" class="block mb-2 font-medium">Usuario</label>
            <span class="p-input-icon-left w-full">
              <i class="pi pi-user"></i>
              <input 
                id="username"
                type="text" 
                pInputText 
                formControlName="username"
                placeholder="Ingrese su usuario"
                class="w-full"
                [class.ng-invalid]="isFieldInvalid('username')"
              />
            </span>
            @if (isFieldInvalid('username')) {
              <small class="p-error">El usuario es requerido</small>
            }
          </div>

          <div class="mb-4">
            <label for="password" class="block mb-2 font-medium">Contraseña</label>
            <p-password 
              id="password"
              formControlName="password"
              placeholder="Ingrese su contraseña"
              [toggleMask]="true"
              [feedback]="false"
              styleClass="w-full"
              inputStyleClass="w-full"
              [class.ng-invalid]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <small class="p-error">La contraseña es requerida</small>
            }
          </div>

          <p-button 
            type="submit"
            label="Iniciar Sesión"
            icon="pi pi-sign-in"
            styleClass="w-full"
            [loading]="loading()"
            [disabled]="loginForm.invalid || loading()"
          />
        </form>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .block {
      display: block;
    }

    .font-medium {
      font-weight: 500;
    }

    .p-error {
      color: #ef4444;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      display: block;
    }

    :host ::ng-deep .p-password {
      width: 100%;
    }

    :host ::ng-deep .p-inputtext {
      width: 100%;
    }
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  loading = signal(false);
  errorMessage = signal('');

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: (response: ApiResponse<LoginResponse>) => {
        if (response.success) {
          this.toastService.success('Bienvenido al sistema');
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/productos';
          this.router.navigate([returnUrl]);
        } else {
          this.errorMessage.set(response.message || 'Error al iniciar sesión');
        }
        this.loading.set(false);
      },
      error: (error: any) => {
        this.loading.set(false);
        if (error.status === 401) {
          this.errorMessage.set('Usuario o contraseña incorrectos');
        } else if (error.status === 0) {
          this.errorMessage.set('No se puede conectar con el servidor');
        } else {
          this.errorMessage.set(error.error?.message || 'Error al iniciar sesión');
        }
      }
    });
  }
}
