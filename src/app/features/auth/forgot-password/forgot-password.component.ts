import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h1>Recuperar Senha</h1>
          @if (step() === 'email') {
            <p>Informe seu e-mail para receber o código de recuperação</p>
          } @else if (step() === 'code') {
            <p>Insira o código enviado para</p>
            <p class="email-highlight">{{ email }}</p>
          } @else {
            <p>Defina sua nova senha</p>
          }
        </div>

        <!-- Step 1: Informar e-mail -->
        @if (step() === 'email') {
          <form [formGroup]="emailForm" (ngSubmit)="onSendCode()">
            <div class="form-group">
              <label for="email">E-mail</label>
              <input
                id="email"
                type="email"
                formControlName="email"
                placeholder="seu@email.com"
                autocomplete="email"
              >
              @if (emailForm.get('email')?.touched && emailForm.get('email')?.errors?.['required']) {
                <span class="error-text">E-mail é obrigatório</span>
              }
              @if (emailForm.get('email')?.touched && emailForm.get('email')?.errors?.['email']) {
                <span class="error-text">E-mail inválido</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="error-banner">{{ errorMessage() }}</div>
            }

            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
                Enviando...
              } @else {
                Enviar código
              }
            </button>
          </form>

          <div class="auth-links">
            <a routerLink="/login">Voltar ao login</a>
          </div>
        }

        <!-- Step 2: Informar código -->
        @if (step() === 'code') {
          <form [formGroup]="codeForm" (ngSubmit)="onVerifyCode()">
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
              @if (codeForm.get('code')?.touched && codeForm.get('code')?.errors?.['required']) {
                <span class="error-text">Código é obrigatório</span>
              }
              @if (codeForm.get('code')?.touched && codeForm.get('code')?.errors?.['minlength']) {
                <span class="error-text">O código deve ter 6 dígitos</span>
              }
            </div>

            <div class="form-group">
              <label for="newPassword">Nova senha</label>
              <input
                id="newPassword"
                type="password"
                formControlName="newPassword"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
              >
              @if (codeForm.get('newPassword')?.touched && codeForm.get('newPassword')?.errors?.['required']) {
                <span class="error-text">Nova senha é obrigatória</span>
              }
              @if (codeForm.get('newPassword')?.touched && codeForm.get('newPassword')?.errors?.['minlength']) {
                <span class="error-text">Senha deve ter no mínimo 8 caracteres</span>
              }
            </div>

            @if (errorMessage()) {
              <div class="error-banner">{{ errorMessage() }}</div>
            }

            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
                Redefinindo...
              } @else {
                Redefinir senha
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
            <a (click)="step.set('email')" class="link-btn">Alterar e-mail</a>
          </div>
        }

        <!-- Step 3: Sucesso -->
        @if (step() === 'success') {
          <div class="success-banner">
            Senha redefinida com sucesso!
          </div>
          <a routerLink="/login" class="btn-primary" style="text-decoration: none; text-align: center;">
            Ir para o login
          </a>
        }
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

    .auth-links a, .link-btn {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      background: none;
      border: none;
      font-family: inherit;
    }
  `]
})
export class ForgotPasswordComponent implements OnDestroy {
  emailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  codeForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.minLength(6)]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(8)])
  });

  email = '';
  step = signal<'email' | 'code' | 'success'>('email');
  loading = signal(false);
  resending = signal(false);
  errorMessage = signal('');
  cooldown = signal(0);

  private cooldownInterval: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnDestroy(): void {
    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }
  }

  onSendCode(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.email = this.emailForm.value.email!;

    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('code');
        this.startCooldown(30);
      },
      error: () => {
        this.loading.set(false);
        // Sempre avança para a tela de código (não revela se o e-mail existe)
        this.step.set('code');
        this.startCooldown(30);
      }
    });
  }

  onVerifyCode(): void {
    if (this.codeForm.invalid) {
      this.codeForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const code = this.codeForm.value.code!;
    const newPassword = this.codeForm.value.newPassword!;

    this.authService.resetPassword(this.email, code, newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.step.set('success');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractError(err, 'Erro ao redefinir senha. Verifique o código.'));
      }
    });
  }

  resendCode(): void {
    this.resending.set(true);
    this.errorMessage.set('');

    this.authService.resendCode(this.email, 'reset').subscribe({
      next: () => {
        this.resending.set(false);
        this.startCooldown(30);
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
