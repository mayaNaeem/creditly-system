import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <header class="header">
        <a routerLink="/accounts" class="brand">Creditly</a>
        <nav>
          <a routerLink="/accounts" routerLinkActive="active">Accounts</a>
          @if (showAuctions()) {
            <a routerLink="/auctions" routerLinkActive="active">Open auctions</a>
          }
          @if (showAnalytics()) {
            <a routerLink="/analytics" routerLinkActive="active">Analytics</a>
          }
        </nav>
        <div class="user">
          <span class="muted">{{ auth.user()?.email }}</span>
          <span class="pill">{{ auth.user()?.role }}</span>
          <button type="button" (click)="auth.logout()">Log out</button>
        </div>
      </header>
      <main class="main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .layout {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex-wrap: wrap;
      padding: 0.75rem 1.5rem;
      background: #0f172a;
      color: #e2e8f0;
      border-bottom: 1px solid #1e293b;
    }
    .brand {
      font-weight: 700;
      font-size: 1.15rem;
      color: #f8fafc;
      text-decoration: none;
    }
    nav {
      display: flex;
      gap: 0.5rem;
      flex: 1;
    }
    nav a {
      color: #94a3b8;
      text-decoration: none;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.9rem;
    }
    nav a.active {
      color: #f8fafc;
      background: #1e293b;
    }
    .user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .pill {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: #334155;
      color: #e2e8f0;
    }
    .user button {
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      border: 1px solid #475569;
      background: transparent;
      color: #e2e8f0;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .user button:hover {
      background: #1e293b;
    }
    .main {
      flex: 1;
      padding: 1.5rem;
      max-width: 960px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }
  `,
})
export class ShellComponent {
  readonly auth = inject(AuthService);

  readonly showAuctions = computed(() => this.auth.hasRole(['BANKER']));
  readonly showAnalytics = computed(() => this.auth.hasRole(['ADMIN', 'MANAGER']));
}
