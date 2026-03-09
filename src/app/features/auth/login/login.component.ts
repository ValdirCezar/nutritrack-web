import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>NutriTrack AI</h1>
          <p>Acompanhe sua alimentação de forma inteligente</p>
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
              placeholder="Sua senha"
              autocomplete="current-password"
            >
            @if (form.get('password')?.touched && form.get('password')?.errors?.['required']) {
              <span class="error-text">Senha é obrigatória</span>
            }
          </div>

          @if (errorMessage()) {
            <div class="error-banner">{{ errorMessage() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Entrando...
            } @else {
              Entrar
            }
          </button>
        </form>

        <div class="auth-links">
          <a routerLink="/forgot-password">Esqueci minha senha</a>
          <p>Não tem conta? <a routerLink="/register">Criar conta</a></p>
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
      font-size: 28px;
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
      margin-top: 12px;
      color: var(--text-secondary);
      font-size: 14px;
    }
  `]
})
export class LoginComponent {
  form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required])
  });

  loading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private apiService: ApiService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.form.value;

    this.authService.login(email!, password!).subscribe({
      next: () => {
        this.apiService.getProfile().subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.router.navigate(['/onboarding']);
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        const errorMsg = this.extractError(err, 'Erro ao fazer login. Verifique suas credenciais.');
        // Se o e-mail não está verificado, redireciona para a tela de verificação
        if (errorMsg.includes('não verificado')) {
          this.router.navigate(['/verify-email'], {
            queryParams: { email: this.form.value.email }
          });
          return;
        }
        this.errorMessage.set(errorMsg);
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
