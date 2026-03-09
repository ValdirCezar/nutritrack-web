import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Criar Conta</h1>
          <p>Comece a acompanhar sua alimentação</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="seu@email.com"
              autocomplete="email"
            >
            @if (form.get('email')?.touched && form.get('email')?.errors?.['required']) {
              <span class="error-text">E-mail é obrigatório</span>
            }
            @if (form.get('email')?.touched && form.get('email')?.errors?.['email']) {
              <span class="error-text">E-mail inválido</span>
            }
          </div>

          <div class="form-group">
            <label for="password">Senha</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="Mínimo 8 caracteres"
              autocomplete="new-password"
            >
            @if (form.get('password')?.touched && form.get('password')?.errors?.['required']) {
              <span class="error-text">Senha é obrigatória</span>
            }
            @if (form.get('password')?.touched && form.get('password')?.errors?.['minlength']) {
              <span class="error-text">Senha deve ter no mínimo 8 caracteres</span>
            }
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirmar Senha</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="Repita a senha"
              autocomplete="new-password"
            >
            @if (form.get('confirmPassword')?.touched && form.errors?.['passwordsMismatch']) {
              <span class="error-text">As senhas não coincidem</span>
            }
          </div>

          @if (errorMessage()) {
            <div class="error-banner">{{ errorMessage() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Criando conta...
            } @else {
              Criar conta
            }
          </button>
        </form>

        <div class="auth-links">
          <p>Já tem conta? <a routerLink="/login">Entrar</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: var(--bg-color);
    }

    .auth-card {
      background: var(--surface-color);
      border-radius: 16px;
      padding: 32px 24px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 32px;
    }

    .auth-header h1 {
      color: var(--primary-color);
      font-size: 24px;
      margin: 0 0 8px 0;
      font-weight: 700;
    }

    .auth-header p {
      color: var(--text-secondary);
      font-size: 14px;
      margin: 0;
    }

    .auth-links {
      text-align: center;
      margin-top: 24px;
    }

    .auth-links a {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }

    .auth-links p {
      color: var(--text-secondary);
      font-size: 14px;
    }
  `]
})
export class RegisterComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: this.passwordMatchValidator });

  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordsMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.value;

    this.authService.register(email!, password!).subscribe({
      next: () => {
        // Redireciona para a tela de verificação de e-mail
        this.router.navigate(['/verify-email'], {
          queryParams: { email: email }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractError(err, 'Erro ao criar conta. Tente novamente.'));
      }
    });
  }

  private extractError(err: any, fallback: string): string {
    if (err?.error && typeof err.error === 'object' && err.error.error) {
      return err.error.error;
    }
    if (err?.error && typeof err.error === 'string') {
      try {
        const parsed = JSON.parse(err.error);
        if (parsed.error) return parsed.error;
      } catch {}
    }
    return fallback;
  }
}
