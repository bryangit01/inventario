// LoginComponent → pantalla de inicio de sesión.
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="login">
      <form class="login-caja" [formGroup]="form" (ngSubmit)="entrar()">
        <div class="lateral-marca login-marca">
          <span class="logo" aria-hidden="true"></span>
          <span class="marca">Inventario</span>
        </div>
        <h1>Inicia sesión</h1>
        <p class="subtitulo">Entra con el correo y la contraseña que te dio tu administrador.</p>

        <label class="campo">
          <span>Correo</span>
          <input type="email" formControlName="email" autocomplete="username" autofocus />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <small class="error-campo">Escribe un correo válido.</small>
          }
        </label>

        <label class="campo">
          <span>Contraseña</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>

        @if (error) {
          <p class="error-campo error-login" role="alert">{{ error }}</p>
        }

        <button type="submit" class="btn btn-primario btn-ancho" [disabled]="enviando">
          {{ enviando ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginComponent {
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  error = '';
  enviando = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    if (this.auth.autenticado) this.router.navigate(['/dashboard']);
  }

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.error = '';
    const { email, password } = this.form.getRawValue();
    this.auth.login(email, password).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.enviando = false;
        this.error = e.status === 0
          ? 'No pudimos conectar con el servidor. ¿Está encendido el backend?'
          : e.error?.mensaje ?? 'No se pudo iniciar sesión.';
      },
    });
  }
}
