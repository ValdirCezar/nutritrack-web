import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Profile } from '../../core/models/profile.model';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="onboarding-container">
      <div class="onboarding-card">
        @if (!profileResult()) {
          <div class="onboarding-header">
            <a routerLink="/dashboard" class="btn-back" title="Voltar ao Dashboard">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </a>
            <h1>Seu Perfil</h1>
            <p>Preencha seus dados para calcularmos suas metas nutricionais</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <div class="form-group">
                <label for="weight">Peso (kg)</label>
                <input
                  id="weight"
                  type="number"
                  formControlName="weight"
                  placeholder="80"
                  min="30"
                  max="300"
                >
                @if (form.get('weight')?.touched && form.get('weight')?.errors?.['required']) {
                  <span class="error-text">Obrigatório</span>
                }
              </div>

              <div class="form-group">
                <label for="height">Altura (cm)</label>
                <input
                  id="height"
                  type="number"
                  formControlName="height"
                  placeholder="175"
                  min="100"
                  max="250"
                >
                @if (form.get('height')?.touched && form.get('height')?.errors?.['required']) {
                  <span class="error-text">Obrigatório</span>
                }
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="age">Idade</label>
                <input
                  id="age"
                  type="number"
                  formControlName="age"
                  placeholder="30"
                  min="10"
                  max="120"
                >
                @if (form.get('age')?.touched && form.get('age')?.errors?.['required']) {
                  <span class="error-text">Obrigatório</span>
                }
              </div>

              <div class="form-group">
                <label for="sex">Sexo</label>
                <select id="sex" formControlName="sex">
                  <option value="" disabled>Selecione</option>
                  <option value="male">Masculino</option>
                  <option value="female">Feminino</option>
                </select>
                @if (form.get('sex')?.touched && form.get('sex')?.errors?.['required']) {
                  <span class="error-text">Obrigatório</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="activity_level">Nível de atividade</label>
              <select id="activity_level" formControlName="activity_level">
                <option value="" disabled>Selecione</option>
                <option value="sedentary">Sedentário (pouco ou nenhum exercício)</option>
                <option value="light">Levemente ativo (1-3 dias/semana)</option>
                <option value="moderate">Moderadamente ativo (3-5 dias/semana)</option>
                <option value="very">Muito ativo (6-7 dias/semana)</option>
                <option value="extreme">Extremamente ativo (atleta/trabalho físico)</option>
              </select>
              @if (form.get('activity_level')?.touched && form.get('activity_level')?.errors?.['required']) {
                <span class="error-text">Obrigatório</span>
              }
            </div>

            <div class="form-group">
              <label for="goal">Objetivo</label>
              <select id="goal" formControlName="goal">
                <option value="" disabled>Selecione</option>
                <option value="hypertrophy">Hipertrofia (ganho de massa muscular)</option>
                <option value="weight_gain">Ganho de peso</option>
                <option value="weight_loss">Emagrecimento</option>
                <option value="recomposition">Recomposição corporal</option>
                <option value="maintenance">Manutenção</option>
              </select>
              @if (form.get('goal')?.touched && form.get('goal')?.errors?.['required']) {
                <span class="error-text">Obrigatório</span>
              }
            </div>

            @if (showWeightGoal()) {
              <div class="weight-goal-section">
                <p class="section-hint">Defina sua meta de peso para um cálculo mais preciso (opcional)</p>
                <div class="form-row">
                  <div class="form-group">
                    <label for="target_weight">Peso desejado (kg)</label>
                    <input
                      id="target_weight"
                      type="number"
                      formControlName="target_weight"
                      [placeholder]="targetWeightPlaceholder()"
                      min="30"
                      max="300"
                      step="0.1"
                    >
                  </div>
                  <div class="form-group">
                    <label for="target_weeks">Prazo (semanas)</label>
                    <input
                      id="target_weeks"
                      type="number"
                      formControlName="target_weeks"
                      placeholder="Ex: 12"
                      min="1"
                      max="104"
                    >
                  </div>
                </div>
                @if (weightGoalSummary()) {
                  <p class="goal-summary">{{ weightGoalSummary() }}</p>
                }
              </div>
            }

            @if (errorMessage()) {
              <div class="error-banner">{{ errorMessage() }}</div>
            }

            <button type="submit" class="btn-primary" [disabled]="loading()">
              @if (loading()) {
                <span class="spinner"></span>
                Calculando...
              } @else {
                Calcular metas
              }
            </button>
          </form>
        } @else {
          <div class="onboarding-header">
            <a routerLink="/dashboard" class="btn-back" title="Voltar ao Dashboard">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M19 12H5"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
            </a>
            <h1>Suas Metas</h1>
            <p>Metas calculadas com base no seu perfil</p>
          </div>

          <div class="results-card">
            <div class="result-row">
              <span class="result-label">TMB (Taxa Metabólica Basal)</span>
              <span class="result-value">{{ profileResult()!.tmb }} kcal</span>
            </div>
            <div class="result-row">
              <span class="result-label">TDEE (Gasto Energético Total)</span>
              <span class="result-value">{{ profileResult()!.tdee }} kcal</span>
            </div>
            <div class="divider"></div>
            <h3>Meta Diária</h3>
            <div class="goals-grid">
              <div class="goal-item">
                <span class="goal-value">{{ profileResult()!.daily_calories }}</span>
                <span class="goal-label">Calorias (kcal)</span>
              </div>
              <div class="goal-item">
                <span class="goal-value">{{ profileResult()!.daily_protein }}g</span>
                <span class="goal-label">Proteína</span>
              </div>
              <div class="goal-item">
                <span class="goal-value">{{ profileResult()!.daily_carbs }}g</span>
                <span class="goal-label">Carboidrato</span>
              </div>
              <div class="goal-item">
                <span class="goal-value">{{ profileResult()!.daily_fat }}g</span>
                <span class="goal-label">Gordura</span>
              </div>
            </div>
          </div>

          <button class="btn-primary" (click)="goToDashboard()">
            Começar
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .onboarding-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: var(--bg-color);
    }

    .onboarding-card {
      background: var(--surface-color);
      border-radius: 16px;
      padding: 32px 24px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .onboarding-header {
      text-align: center;
      margin-bottom: 28px;
      position: relative;
    }

    .btn-back {
      position: absolute;
      top: 0;
      left: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 10px;
      color: var(--text-secondary);
      text-decoration: none;
      transition: all 0.15s ease;
    }

    .btn-back:hover {
      background: var(--bg-color);
      color: var(--primary-color);
    }

    .btn-back:active {
      background: #E8E8E8;
    }

    .onboarding-header h1 {
      color: var(--primary-color);
      font-size: 24px;
      margin: 0 0 8px 0;
      font-weight: 700;
    }

    .onboarding-header p {
      color: var(--text-secondary);
      font-size: 14px;
      margin: 0;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .results-card {
      background: var(--bg-color);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .result-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
    }

    .result-label {
      color: var(--text-secondary);
      font-size: 13px;
    }

    .result-value {
      color: var(--text-primary);
      font-weight: 600;
      font-size: 14px;
    }

    .divider {
      height: 1px;
      background: #E0E0E0;
      margin: 12px 0;
    }

    .results-card h3 {
      color: var(--primary-color);
      font-size: 16px;
      margin: 0 0 16px 0;
      text-align: center;
    }

    .goals-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .goal-item {
      text-align: center;
      background: var(--surface-color);
      padding: 12px 8px;
      border-radius: 8px;
    }

    .goal-value {
      display: block;
      font-size: 22px;
      font-weight: 700;
      color: var(--primary-color);
    }

    .goal-label {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .weight-goal-section {
      background: var(--bg-color);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }

    .section-hint {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 0 0 12px 0;
    }

    .goal-summary {
      font-size: 13px;
      color: var(--primary-color);
      margin: 8px 0 0 0;
      font-weight: 500;
    }
  `]
})
export class OnboardingComponent implements OnInit {
  form = new FormGroup({
    weight: new FormControl<number | null>(null, [Validators.required, Validators.min(30), Validators.max(300)]),
    height: new FormControl<number | null>(null, [Validators.required, Validators.min(100), Validators.max(250)]),
    age: new FormControl<number | null>(null, [Validators.required, Validators.min(10), Validators.max(120)]),
    sex: new FormControl('', [Validators.required]),
    activity_level: new FormControl('', [Validators.required]),
    goal: new FormControl('', [Validators.required]),
    target_weight: new FormControl<number | null>(null),
    target_weeks: new FormControl<number | null>(null)
  });

  loading = signal(false);
  errorMessage = signal('');
  profileResult = signal<Profile | null>(null);
  private selectedGoal = signal('');

  // Mostra campos de meta de peso apenas para objetivos que envolvem mudança de peso
  showWeightGoal = computed(() => {
    const goal = this.selectedGoal();
    return goal === 'hypertrophy' || goal === 'weight_gain' || goal === 'weight_loss';
  });

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {
    // Atualiza o signal quando o goal muda no formulário
    this.form.get('goal')?.valueChanges.subscribe(val => {
      this.selectedGoal.set(val || '');
      // Limpa os campos de meta se o objetivo não suporta
      if (!this.showWeightGoal()) {
        this.form.patchValue({ target_weight: null, target_weeks: null });
      }
    });
  }

  ngOnInit(): void {
    // Carrega o perfil existente para preencher o formulário
    this.loadExistingProfile();
  }

  private loadExistingProfile(): void {
    this.apiService.getProfile().subscribe({
      next: (profile) => {
        // Preenche o formulário com os dados existentes
        this.form.patchValue({
          weight: profile.weight,
          height: profile.height,
          age: profile.age,
          sex: profile.sex,
          activity_level: profile.activity_level,
          goal: profile.goal,
          target_weight: profile.target_weight || null,
          target_weeks: profile.target_weeks || null
        });
        this.selectedGoal.set(profile.goal);
      },
      error: () => {
        // Perfil não existe ainda — formulário vazio (primeiro acesso)
      }
    });
  }

  // Placeholder dinâmico baseado no objetivo
  targetWeightPlaceholder(): string {
    const goal = this.selectedGoal();
    if (goal === 'weight_loss') return 'Ex: 75';
    return 'Ex: 90';
  }

  // Resumo da meta de peso para o usuário
  weightGoalSummary(): string {
    const weight = this.form.value.weight;
    const target = this.form.value.target_weight;
    const weeks = this.form.value.target_weeks;
    if (!weight || !target || !weeks || weeks <= 0) return '';

    const diff = Math.abs(target - weight);
    const perWeek = (diff / weeks).toFixed(1);
    const action = target > weight ? 'ganhar' : 'perder';
    return `Meta: ${action} ${diff.toFixed(1)}kg em ${weeks} semanas (~${perWeek}kg/semana)`;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const request: any = {
      weight: this.form.value.weight!,
      height: this.form.value.height!,
      age: this.form.value.age!,
      sex: this.form.value.sex!,
      activity_level: this.form.value.activity_level!,
      goal: this.form.value.goal!
    };

    // Inclui meta de peso e prazo se preenchidos
    if (this.form.value.target_weight && this.form.value.target_weeks) {
      request.target_weight = this.form.value.target_weight;
      request.target_weeks = this.form.value.target_weeks;
    }

    this.apiService.createProfile(request).subscribe({
      next: (profile) => {
        this.loading.set(false);
        this.profileResult.set(profile);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.extractError(err, 'Erro ao calcular metas. Tente novamente.'));
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
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
