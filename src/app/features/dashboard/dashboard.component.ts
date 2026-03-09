import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardResponse, Meal } from '../../core/models/meal.model';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';

// Declaração para o Web Speech API (não incluído nos tipos padrão do TypeScript)
declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ProgressBarComponent],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-left">
          <h1>NutriTrack</h1>
          <p class="date-text">{{ formattedDate() }}</p>
        </div>
        <button class="btn-icon" (click)="logout()" title="Sair">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      @if (loadingDashboard()) {
        <div class="loading-section">
          <span class="spinner spinner-lg"></span>
          <p>Carregando dados...</p>
        </div>
      }

      <!-- Dashboard Content -->
      @if (dashboard()) {
        <div class="progress-section card">
          <h2>Resumo do Dia</h2>
          <app-progress-bar
            label="Calorias"
            [consumed]="dashboard()!.consumed.calories"
            [goal]="dashboard()!.goals.calories"
            unit="kcal"
            color="var(--primary-color)"
          />
          <app-progress-bar
            label="Proteína"
            [consumed]="dashboard()!.consumed.protein"
            [goal]="dashboard()!.goals.protein"
            unit="g"
            color="var(--secondary-color)"
          />
          <app-progress-bar
            label="Carboidrato"
            [consumed]="dashboard()!.consumed.carbs"
            [goal]="dashboard()!.goals.carbs"
            unit="g"
            color="var(--warning-color)"
          />
          <app-progress-bar
            label="Gordura"
            [consumed]="dashboard()!.consumed.fat"
            [goal]="dashboard()!.goals.fat"
            unit="g"
            color="#AB47BC"
          />
        </div>
      }

      <!-- Meal Input -->
      <div class="meal-input-section card">
        <h2>Registrar Refeição</h2>
        <div class="input-row">
          <textarea
            [formControl]="mealDescription"
            placeholder="Descreva o que você comeu...&#10;Ex: 2 ovos, 100g de arroz e salada"
            rows="3"
          ></textarea>
          @if (speechSupported) {
            <button
              class="btn-mic"
              [class.recording]="isRecording()"
              (pointerdown)="startRecording($event)"
              (pointerup)="stopRecording()"
              (pointerleave)="stopRecording()"
              title="Segurar para gravar"
            >
              @if (isRecording()) {
                <div class="pulse-ring"></div>
              }
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          }
        </div>

        @if (mealError()) {
          <div class="error-banner">{{ mealError() }}</div>
        }

        <button
          class="btn-primary"
          (click)="registerMeal()"
          [disabled]="registeringMeal() || !mealDescription.value?.trim()"
        >
          @if (registeringMeal()) {
            <span class="spinner"></span>
            Analisando refeição...
          } @else {
            Registrar
          }
        </button>
      </div>

      <!-- Meals List -->
      @if (dashboard()?.meals?.length) {
        <div class="meals-section card">
          <h2>Refeições de Hoje</h2>
          @for (meal of dashboard()!.meals; track meal.id) {
            <div class="meal-card" [class.expanded]="expandedMeals[meal.id]" (click)="toggleMeal(meal.id)">
              <div class="meal-header">
                <span class="meal-description">{{ meal.description }}</span>
                <div class="meal-header-right">
                  <span class="meal-calories">{{ meal.totals.calories }} kcal</span>
                  <svg class="expand-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>
              @if (expandedMeals[meal.id]) {
                <div class="meal-details">
                  @if (meal.foods?.length) {
                    <div class="meal-foods">
                      @for (food of meal.foods; track food.name) {
                        <div class="food-item">
                          <span class="food-name">{{ food.name }} ({{ food.quantity }}{{ food.unit }})</span>
                          <span class="food-macros">
                            P: {{ food.protein }}g |
                            C: {{ food.carbs }}g |
                            G: {{ food.fat }}g
                          </span>
                        </div>
                      }
                    </div>
                  }
                  <div class="meal-totals">
                    <span>P: {{ meal.totals.protein }}g</span>
                    <span>C: {{ meal.totals.carbs }}g</span>
                    <span>G: {{ meal.totals.fat }}g</span>
                  </div>
                  <button
                    class="btn-delete-meal"
                    (click)="deleteMeal(meal.id, $event)"
                    [disabled]="deletingMealId() === meal.id"
                  >
                    @if (deletingMealId() === meal.id) {
                      <span class="spinner spinner-sm"></span>
                      Excluindo...
                    } @else {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Excluir refeição
                    }
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      @if (dashboard() && !dashboard()!.meals?.length && !loadingDashboard()) {
        <div class="empty-state card">
          <p>Nenhuma refeição registrada hoje.</p>
          <p class="text-secondary">Use o campo acima para registrar sua primeira refeição!</p>
        </div>
      }

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <a routerLink="/dashboard" class="nav-item active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </a>
        <a routerLink="/history" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Histórico</span>
        </a>
        <a routerLink="/onboarding" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Perfil</span>
        </a>
      </nav>
    </div>
  `,
  styles: [`
    .dashboard-container {
      min-height: 100vh;
      background: var(--bg-color);
      padding: 16px 16px 80px 16px;
      max-width: 600px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 0 4px;
    }

    .header-left h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
    }

    .date-text {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 2px 0 0 0;
    }

    .btn-icon {
      background: none;
      border: none;
      padding: 8px;
      color: var(--text-secondary);
      cursor: pointer;
      border-radius: 8px;
    }

    .btn-icon:active {
      background: #f0f0f0;
    }

    .card {
      background: var(--surface-color);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    }

    .card h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 16px 0;
    }

    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 0;
      color: var(--text-secondary);
    }

    .loading-section p {
      margin-top: 12px;
      font-size: 14px;
    }

    /* Meal Input */
    .input-row {
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }

    .meal-input-section textarea {
      flex: 1;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      padding: 12px;
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      min-height: 80px;
      box-sizing: border-box;
      margin-bottom: 12px;
      color: var(--text-primary);
      background: var(--bg-color);
    }

    .meal-input-section textarea:focus {
      outline: none;
      border-color: var(--primary-color);
    }

    .meal-input-section textarea::placeholder {
      color: var(--text-secondary);
    }

    /* Botão do microfone */
    .btn-mic {
      position: relative;
      width: 48px;
      height: 48px;
      min-width: 48px;
      border-radius: 50%;
      border: 2px solid #E0E0E0;
      background: var(--bg-color);
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      margin-top: 4px;
      touch-action: none;
      -webkit-user-select: none;
      user-select: none;
    }

    .btn-mic:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }

    .btn-mic.recording {
      border-color: var(--error-color);
      background: #FFEBEE;
      color: var(--error-color);
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2px solid var(--error-color);
      animation: pulse 1.2s ease-out infinite;
    }

    @keyframes pulse {
      0% {
        transform: scale(1);
        opacity: 1;
      }
      100% {
        transform: scale(1.6);
        opacity: 0;
      }
    }

    /* Meal Cards - Expansíveis */
    .meal-card {
      background: var(--bg-color);
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 10px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .meal-card:last-child {
      margin-bottom: 0;
    }

    .meal-card:active {
      background: #EEEEEE;
    }

    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .meal-header-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .meal-description {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      flex: 1;
      margin-right: 8px;
    }

    .meal-calories {
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-color);
      white-space: nowrap;
    }

    .expand-icon {
      color: var(--text-secondary);
      transition: transform 0.2s ease;
    }

    .meal-card.expanded .expand-icon {
      transform: rotate(180deg);
    }

    .meal-details {
      margin-top: 10px;
      animation: slideDown 0.2s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .meal-foods {
      margin-bottom: 8px;
    }

    .food-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 0;
      font-size: 12px;
    }

    .food-name {
      color: var(--text-primary);
    }

    .food-macros {
      color: var(--text-secondary);
      font-size: 11px;
      white-space: nowrap;
    }

    .meal-totals {
      display: flex;
      gap: 12px;
      padding-top: 8px;
      border-top: 1px solid #E8E8E8;
      font-size: 12px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    .btn-delete-meal {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      margin-top: 12px;
      padding: 8px 12px;
      border: 1px solid #FFCDD2;
      border-radius: 8px;
      background: #FFF5F5;
      color: #D32F2F;
      font-size: 12px;
      font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-delete-meal:hover:not(:disabled) {
      background: #FFEBEE;
      border-color: #EF9A9A;
    }

    .btn-delete-meal:active:not(:disabled) {
      background: #FFCDD2;
    }

    .btn-delete-meal:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner-sm {
      width: 14px;
      height: 14px;
      border-width: 2px;
    }

    .empty-state {
      text-align: center;
      padding: 32px 20px;
    }

    .empty-state p {
      margin: 0 0 8px 0;
      font-size: 14px;
      color: var(--text-primary);
    }

    .text-secondary {
      color: var(--text-secondary) !important;
      font-size: 13px !important;
    }

    /* Bottom Navigation */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--surface-color);
      display: flex;
      justify-content: space-around;
      padding: 8px 0;
      box-shadow: 0 -1px 4px rgba(0, 0, 0, 0.08);
      z-index: 100;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-decoration: none;
      color: var(--text-secondary);
      font-size: 11px;
      padding: 4px 12px;
      gap: 2px;
    }

    .nav-item.active {
      color: var(--primary-color);
    }

    @media (min-width: 768px) {
      .dashboard-container {
        padding: 24px 24px 80px 24px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboard = signal<DashboardResponse | null>(null);
  loadingDashboard = signal(true);
  registeringMeal = signal(false);
  mealError = signal('');
  mealDescription = new FormControl('');
  isRecording = signal(false);

  deletingMealId = signal<string | null>(null);

  // Estado dos cards expansíveis
  expandedMeals: Record<string, boolean> = {};
  speechSupported = false;
  private recognition: any;

  private today: string;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.today = this.formatDateISO(new Date());

    // Verifica se o navegador suporta Web Speech API
    this.speechSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    if (this.speechSupported) {
      this.initSpeechRecognition();
    }
  }

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  formattedDate(): string {
    const date = new Date(this.today + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  loadDashboard(): void {
    this.loadingDashboard.set(true);
    this.apiService.getDashboard(this.today).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loadingDashboard.set(false);
      },
      error: () => {
        this.loadingDashboard.set(false);
      }
    });
  }

  registerMeal(): void {
    const description = this.mealDescription.value?.trim();
    if (!description) return;

    this.registeringMeal.set(true);
    this.mealError.set('');

    this.apiService.registerMeal(description).subscribe({
      next: () => {
        this.registeringMeal.set(false);
        this.mealDescription.setValue('');
        this.loadDashboard();
      },
      error: (err) => {
        this.registeringMeal.set(false);
        this.mealError.set(this.extractError(err, 'Erro ao registrar refeição. Tente novamente.'));
      }
    });
  }

  // --- Reconhecimento de Voz ---

  private initSpeechRecognition(): void {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'pt-BR';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      // Atualiza o campo de texto com o resultado do reconhecimento
      this.mealDescription.setValue(transcript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error);
      this.isRecording.set(false);
      if (event.error === 'not-allowed') {
        this.mealError.set('Permissão de microfone negada. Habilite nas configurações do navegador.');
      }
    };

    this.recognition.onend = () => {
      this.isRecording.set(false);
    };
  }

  startRecording(event: Event): void {
    event.preventDefault(); // Previne comportamento padrão em touch
    if (!this.recognition || this.isRecording()) return;

    this.isRecording.set(true);
    this.mealError.set('');
    this.mealDescription.setValue('');

    try {
      this.recognition.start();
    } catch (e) {
      // Já pode estar iniciado
      this.isRecording.set(false);
    }
  }

  stopRecording(): void {
    if (!this.recognition || !this.isRecording()) return;

    this.recognition.stop();
    this.isRecording.set(false);

    // Se capturou texto, registra automaticamente a refeição
    setTimeout(() => {
      const text = this.mealDescription.value?.trim();
      if (text) {
        this.registerMeal();
      }
    }, 300);
  }

  // --- Cards Expansíveis ---

  toggleMeal(mealId: string): void {
    this.expandedMeals[mealId] = !this.expandedMeals[mealId];
  }

  deleteMeal(mealId: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir esta refeição?')) return;

    this.deletingMealId.set(mealId);
    this.apiService.deleteMeal(mealId).subscribe({
      next: () => {
        this.deletingMealId.set(null);
        delete this.expandedMeals[mealId];
        this.loadDashboard();
      },
      error: () => {
        this.deletingMealId.set(null);
        this.mealError.set('Erro ao excluir refeição. Tente novamente.');
      }
    });
  }

  // --- Utilitários ---

  logout(): void {
    this.authService.logout();
  }

  private formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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
