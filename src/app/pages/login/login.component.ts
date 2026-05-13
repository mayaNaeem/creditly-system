import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/http-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="panel">
      <h1>Creditly</h1>
      <p class="muted">Sign in to manage accounts, auctions, and events.</p>
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <label>
        Email
        <input type="email" [(ngModel)]="email" name="email" autocomplete="username" />
      </label>
      <label>
        Password
        <input
          type="password"
          [(ngModel)]="password"
          name="password"
          autocomplete="current-password"
        />
      </label>
      <button type="button" (click)="submit()" [disabled]="loading()">
        {{ loading() ? 'Signing in…' : 'Sign in' }}
      </button>
      <p class="hint muted">
        After running <code>npm run seed</code> in <code>backend/</code>, try
        <code>manager@creditly.demo</code> / <code>Creditly123!</code>
      </p>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      min-height: 100vh;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .panel {
      width: 100%;
      max-width: 400px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: var(--shadow);
    }
    h1 {
      margin: 0 0 0.5rem;
      font-size: 1.75rem;
    }
    label {
      display: block;
      margin-top: 1rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    input {
      width: 100%;
      margin-top: 0.35rem;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      font: inherit;
    }
    button {
      margin-top: 1.25rem;
      width: 100%;
      padding: 0.65rem 1rem;
      border: none;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .hint {
      margin-top: 1.25rem;
      font-size: 0.8rem;
      line-height: 1.4;
    }
    code {
      font-size: 0.78rem;
    }
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);

  email = 'manager@creditly.demo';
  password = 'Creditly123!';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password).subscribe({
      next: () => this.loading.set(false),
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
