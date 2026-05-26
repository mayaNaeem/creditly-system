import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/http-error';

const DEMO_ROLES = [
  { label: 'Admin', email: 'admin@creditly.demo', description: 'Full access' },
  { label: 'Manager', email: 'manager@creditly.demo', description: 'Manages accounts & auctions' },
  { label: 'Banker', email: 'banker@creditly.demo', description: 'Submits offers' },
  { label: 'User', email: 'customer@creditly.demo', description: 'Creates events' },
] as const;

const DEMO_PASSWORD = 'Creditly123!';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="wrap">
      <div class="panel">
        <h1>Creditly</h1>
        <p class="sub">Internal Platform — Banking Auction System</p>

        @if (error()) {
          <div class="error-box">{{ error() }}</div>
        }

        <div class="section-label">Demo — choose a role:</div>
        <div class="roles">
          @for (r of roles; track r.email) {
            <button
              class="role-btn"
              type="button"
              [disabled]="loading()"
              (click)="loginAs(r.email)"
            >
              <span class="role-name">{{ r.label }}</span>
              <span class="role-desc">{{ r.description }}</span>
            </button>
          }
        </div>

        <div class="divider"><span>or sign in manually</span></div>

        <form (ngSubmit)="submit()">
          <label>
            Email
            <input type="email" [(ngModel)]="email" name="email" autocomplete="username" />
          </label>
          <label>
            Password
            <input type="password" [(ngModel)]="password" name="password" autocomplete="current-password" />
          </label>
          <button type="submit" class="submit-btn" [disabled]="loading()">
            {{ loading() ? 'Signing in…' : 'Sign in' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: var(--bg);
    }
    .panel {
      width: 100%;
      max-width: 480px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 2rem 2rem 1.75rem;
      box-shadow: var(--shadow);
    }
    h1 {
      margin: 0 0 0.15rem;
      font-size: 1.9rem;
      font-weight: 700;
    }
    .sub {
      margin: 0 0 1.5rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
    .section-label {
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      margin-bottom: 0.6rem;
    }
    .roles {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.6rem;
      margin-bottom: 1.25rem;
    }
    .role-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
      padding: 0.75rem 1rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: #f8fafc;
      cursor: pointer;
      transition: background 0.12s, border-color 0.12s;
      text-align: left;
    }
    .role-btn:hover:not(:disabled) {
      background: #e0f2fe;
      border-color: var(--accent);
    }
    .role-btn:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
    .role-name {
      font-weight: 700;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .role-desc {
      font-size: 0.75rem;
      color: var(--muted);
    }
    .divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 1rem 0;
      color: var(--muted);
      font-size: 0.8rem;
    }
    .divider::before,
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    label {
      display: block;
      margin-top: 0.9rem;
      font-size: 0.875rem;
      font-weight: 500;
    }
    input {
      display: block;
      width: 100%;
      margin-top: 0.35rem;
      padding: 0.6rem 0.75rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      font: inherit;
      box-sizing: border-box;
    }
    .submit-btn {
      margin-top: 1rem;
      width: 100%;
      padding: 0.65rem 1rem;
      border: none;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .error-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      border-radius: 8px;
      padding: 0.6rem 0.85rem;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);

  readonly roles = DEMO_ROLES;
  email = '';
  password = '';
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loginAs(email: string): void {
    this.email = email;
    this.password = DEMO_PASSWORD;
    this.doLogin();
  }

  submit(): void {
    this.doLogin();
  }

  private doLogin(): void {
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
