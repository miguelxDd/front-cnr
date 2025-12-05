import { Component, Input } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [ProgressSpinnerModule],
  template: `
    @if (loading) {
      <div class="loading-overlay">
        <p-progressSpinner 
          strokeWidth="4" 
          [style]="{ width: '50px', height: '50px' }"
        />
        @if (message) {
          <p class="loading-message">{{ message }}</p>
        }
      </div>
    }
  `,
  styles: `
    .loading-overlay {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 1rem;
    }

    .loading-message {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
    }
  `
})
export class LoadingComponent {
  @Input() loading = false;
  @Input() message = '';
}
