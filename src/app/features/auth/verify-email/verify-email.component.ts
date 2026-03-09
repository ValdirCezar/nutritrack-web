import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Verificar E-mail</h1>
          <p>Insira o código de 6 dígitos enviado para</p>
          <p class="email-highlight">{{ email }}</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="code">Código de verificação</label>
            <input
              id="code"
              type="text"
              formControlName="code"
              placeholder="000000"
              maxlength="6"
              inputmode="numeric"
              autocomplete="one-time-code"
              class="code-input"
            >
            @if (form.get('code')?.touched && form.get('code')?.errors?.['required']) {
              <span class="error-text">Código é obrigatório</span>
            }
            @if (form.get('code')?.touched && form.get('code')?.errors?.['minlength']) {
              <span class="error-text">O código deve ter 6 dígitos</span>
            }
          </div>

          @if (errorMessage()) {
            <div class="error-banner">{{ errorMessage() }}</div>
          }

          @if (successMessage()) {
            <div class="success-banner">{{ successMessage() }}</div>
          }

          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
              Verificando...
            } @else {
              Verificar
            }
          </button>
        </form>

        <div class="resend-section">
          <p>Não recebeu o código?</p>
          <button
            class="btn-resend"
            (click)="resendCode()"
            [disabled]="resending() || cooldown() > 0"
          >
            @if (resending()) {
              Reenviando...
            } @else if (cooldown() > 0) {
              Reenviar em {{ cooldown() }}s
            } @else {
              Reenviar código
            }
          </button>
        </div>

        <div class="auth-links">
          <a routerLink="/register">Voltar ao cadastro</a>
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

    .email-highlight {
      color: var(--text-primary) !important;
      font-weight: 600;
      margin-top: 4px !important;
    }

    .code-input {
      text-align: center;
      font-size: 24px !important;
      font-weight: 700;
      letter-spacing: 8px;
      padding: 16px !important;
    }

    .resend-section {
      text-align: center;
      margin-top: 24px;
    }

    .resend-section p {
      color: var(--text-secondary);
      font-size: 13px;
      margin: 0 0 8px 0;
    }

    .btn-resend {
      background: none;
      border: none;
      color: var(--primary-color);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      font-family: inherit;
      padding: 4px 8px;
    }

    .btn-resend:disabled {
      color: var(--text-secondary);
      cursor: not-allowed;
    }

    .auth-links {
      text-align: center;
      margin-top: 16px;
    }

    .auth-links a {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  form = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  email = '';
  loading = signal(false);
  resending = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  cooldown = signal(0);

  private cooldownInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Recebe o e-mail via query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        this.router.navigate(['/register']);
      }
    });

    // Inicia cooldown inicial (acabou de receber o código)
    this.startCooldown(60);
  }

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const code = this.form.value.code!;

    this.authService.verifyEmail(this.email, code).subscribe({
      next: () => {
        this.router.navigate(['/onboarding']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractError(err, 'Erro ao verificar código. Tente novamente.'));
      }
    });
  }

  resendCode(): void {
    this.resending.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.resendCode(this.email, 'register').subscribe({
      next: () => {
        this.resending.set(false);
        this.successMessage.set('Novo código enviado para seu e-mail!');
        this.startCooldown(60);
      },
      error: (err) => {
        this.resending.set(false);
        this.errorMessage.set(this.extractError(err, 'Erro ao reenviar código.'));
      }
    });
  }

  private startCooldown(seconds: number): void {
    this.cooldown.set(seconds);
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
    this.cooldownInterval = setInterval(() => {
      const current = this.cooldown();
      if (current <= 1) {
        this.cooldown.set(0);
        clearInterval(this.cooldownInterval);
      } else {
        this.cooldown.set(current - 1);
      }
    }, 1000);
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
