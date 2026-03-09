import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, AuthResponse, ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl + '/auth';
  private readonly TOKEN_KEY = 'nutritrack_token';

  isAuthenticated = signal(false);
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.checkStoredToken();
  }

  private checkStoredToken(): void {
    const token = this.getToken();
    if (token) {
      this.isAuthenticated.set(true);
      this.getMe().subscribe({
        next: (user) => {
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
        },
        error: (err) => {
          // Só limpa autenticação se o token for inválido (401)
          // Erros de rede/timeout não devem deslogar o usuário
          if (err?.status === 401) {
            this.clearAuth();
          }
        }
      });
    }
  }

  private clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Registra o usuário (retorna sem token — precisa verificar e-mail)
  register(email: string, password: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/register`,
      { email, password }
    );
  }

  // Verifica o código de e-mail e retorna token JWT
  verifyEmail(email: string, code: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/verify-email`,
      { email, code }
    ).pipe(
      map(response => {
        const data = response.data!;
        localStorage.setItem(this.TOKEN_KEY, data.token);
        this.isAuthenticated.set(true);
        this.currentUser.set(data.user);
        return data;
      })
    );
  }

  // Reenvia o código de verificação
  resendCode(email: string, type: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/resend-code`,
      { email, type }
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.apiUrl}/login`,
      { email, password }
    ).pipe(
      map(response => {
        const data = response.data!;
        localStorage.setItem(this.TOKEN_KEY, data.token);
        this.isAuthenticated.set(true);
        this.currentUser.set(data.user);
        return data;
      })
    );
  }

  logout(): void {
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/password`,
      { old_password: oldPassword, new_password: newPassword }
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/forgot-password`,
      { email }
    );
  }

  // Reset de senha agora usa código + e-mail
  resetPassword(email: string, code: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/reset-password`,
      { email, code, new_password: newPassword }
    );
  }

  changeEmail(newEmail: string, password: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(
      `${this.apiUrl}/email`,
      { new_email: newEmail, password }
    );
  }

  getMe(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      map(response => response.data!)
    );
  }
}
