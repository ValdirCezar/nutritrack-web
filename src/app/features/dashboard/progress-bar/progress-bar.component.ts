import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-wrapper">
      <div class="progress-header">
        <span class="progress-label">{{ label() }}</span>
        <span class="progress-values">
          {{ formatNumber(consumed()) }} / {{ formatNumber(goal()) }} {{ unit() }}
          <span class="progress-percent">({{ percentage() }}%)</span>
        </span>
      </div>
      <div class="progress-track">
        <div
          class="progress-fill"
          [style.transform]="'scaleX(' + scaleValue() + ')'"
          [style.background-color]="barColor()"
        ></div>
      </div>
      <div class="progress-status" [style.color]="statusColor()">
        {{ statusText() }}
      </div>
    </div>
  `,
  styles: [`
    .progress-wrapper {
      margin-bottom: 16px;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .progress-label {
      font-weight: 600;
      font-size: 14px;
      color: var(--text-primary);
    }

    .progress-values {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .progress-percent {
      font-weight: 600;
    }

    .progress-track {
      height: 10px;
      background: #E8E8E8;
      border-radius: 5px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 5px;
      transform-origin: left center;
      transition: transform 0.3s ease;
      will-change: transform;
    }

    .progress-status {
      font-size: 11px;
      margin-top: 4px;
      text-align: right;
    }
  `]
})
export class ProgressBarComponent {
  label = input('');
  consumed = input(0);
  goal = input(0);
  unit = input('');
  color = input('var(--primary-color)');

  percentage = computed(() => {
    if (this.goal() === 0) return 0;
    return Math.round((this.consumed() / this.goal()) * 100);
  });

  scaleValue = computed(() => {
    const pct = this.percentage();
    return Math.min(pct / 100, 1);
  });

  barColor = computed(() => {
    const pct = this.percentage();
    if (pct > 110) return 'var(--error-color)';
    if (pct > 100) return 'var(--warning-color)';
    return this.color();
  });

  statusText = computed(() => {
    const remaining = this.goal() - this.consumed();
    if (remaining > 0.05) return `Faltam ${this.formatNumber(remaining)} ${this.unit()}`;
    if (remaining >= -0.05) return 'Meta atingida!';
    return `Acima +${this.formatNumber(Math.abs(remaining))} ${this.unit()}`;
  });

  formatNumber(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  }

  statusColor = computed(() => {
    const remaining = this.goal() - this.consumed();
    if (remaining < 0) return 'var(--error-color)';
    if (remaining === 0) return 'var(--primary-color)';
    return 'var(--text-secondary)';
  });
}
