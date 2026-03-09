import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardResponse } from '../../core/models/meal.model';
import { ProgressBarComponent } from '../dashboard/progress-bar/progress-bar.component';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ProgressBarComponent],
  template: `
    <div class="history-container">
      <div class="history-header">
        <h1>Histórico</h1>
      </div>

      <!-- Date Picker -->
      <div class="date-picker card">
        <label for="date">Selecione a data:</label>
        <input
          id="date"
          type="date"
          [formControl]="dateControl"
          [max]="todayISO"
          (change)="onDateChange()"
        >
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-section">
          <span class="spinner spinner-lg"></span>
          <p>Carregando dados...</p>
        </div>
      }

      @if (errorMessage()) {
        <div class="card">
          <div class="error-banner">{{ errorMessage() }}</div>
        </div>
      }

      <!-- Dashboard Data -->
      @if (dashboard() && !loading()) {
        <div class="progress-section card">
          <h2>Resumo - {{ formattedSelectedDate() }}</h2>
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

        <!-- Meals List -->
        @if (dashboard()!.meals?.length) {
          <div class="meals-section card">
            <h2>Refeições</h2>
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

        @if (!dashboard()!.meals?.length && !loading()) {
          <div class="empty-state card">
            <p>Nenhuma refeição registrada nesta data.</p>
          </div>
        }
      }

      <!-- Bottom Navigation -->
      <nav class="bottom-nav">
        <a routerLink="/dashboard" class="nav-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span>Dashboard</span>
        </a>
        <a routerLink="/history" class="nav-item active">
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
    .history-container {
      min-height: 100vh;
      background: var(--bg-color);
      padding: 16px 16px 80px 16px;
      max-width: 600px;
      margin: 0 auto;
    }

    .history-header {
      margin-bottom: 16px;
      padding: 0 4px;
    }

    .history-header h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
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

    .date-picker {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .date-picker label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      white-space: nowrap;
    }

    .date-picker input[type="date"] {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid #E0E0E0;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      color: var(--text-primary);
      background: var(--bg-color);
    }

    .date-picker input[type="date"]:focus {
      outline: none;
      border-color: var(--primary-color);
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
      transition: background-color 0.15s ease, border-color 0.15s ease;
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
      margin: 0;
      font-size: 14px;
      color: var(--text-secondary);
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
      .history-container {
        padding: 24px 24px 80px 24px;
      }
    }
  `]
})
export class HistoryComponent implements OnInit {
  dashboard = signal<DashboardResponse | null>(null);
  loading = signal(false);
  errorMessage = signal('');
  deletingMealId = signal<string | null>(null);
  dateControl: FormControl;
  todayISO: string;

  // Estado dos cards expansíveis
  expandedMeals: Record<string, boolean> = {};

  constructor(private apiService: ApiService) {
    this.todayISO = this.formatDateISO(new Date());
    this.dateControl = new FormControl(this.todayISO);
  }

  ngOnInit(): void {
    this.loadData(this.todayISO);
  }

  formattedSelectedDate(): string {
    const dateStr = this.dateControl.value;
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  onDateChange(): void {
    const date = this.dateControl.value;
    if (date) {
      this.expandedMeals = {}; // Reseta expansão ao mudar a data
      this.loadData(date);
    }
  }

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
        this.loadData(this.dateControl.value);
      },
      error: () => {
        this.deletingMealId.set(null);
        this.errorMessage.set('Erro ao excluir refeição. Tente novamente.');
      }
    });
  }

  private loadData(date: string): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.dashboard.set(null);

    this.apiService.getDashboard(date).subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.error || 'Erro ao carregar dados. Tente novamente.'
        );
      }
    });
  }

  private formatDateISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
