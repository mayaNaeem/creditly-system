import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/http-error';

type Summary = {
  accounts: number;
  auctionsOpen: number;
  auctionsClosed: number;
  offers: number;
};

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1>Analytics</h1>
    @if (loading()) {
      <p>Loading…</p>
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else if (summary()) {
      @let s = summary()!;
      <div class="grid">
        <div class="stat">
          <span class="num">{{ s.accounts }}</span>
          <span class="lbl">Accounts</span>
        </div>
        <div class="stat">
          <span class="num">{{ s.auctionsOpen }}</span>
          <span class="lbl">Open auctions</span>
        </div>
        <div class="stat">
          <span class="num">{{ s.auctionsClosed }}</span>
          <span class="lbl">Closed auctions</span>
        </div>
        <div class="stat">
          <span class="num">{{ s.offers }}</span>
          <span class="lbl">Offers</span>
        </div>
      </div>
    }
    <p class="muted"><a routerLink="/accounts">← Accounts</a></p>
  `,
  styles: `
    h1 {
      margin-bottom: 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }
    .stat {
      padding: 1rem;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .num {
      font-size: 1.75rem;
      font-weight: 700;
    }
    .lbl {
      font-size: 0.85rem;
      color: var(--muted);
    }
  `,
})
export class AnalyticsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly summary = signal<Summary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    if (!this.auth.hasRole(['ADMIN', 'MANAGER'])) {
      this.error.set('You do not have access to analytics.');
      this.loading.set(false);
      return;
    }
    this.http.get<Summary>(`${environment.apiBaseUrl}/analytics/summary`).subscribe({
      next: (s) => {
        this.summary.set(s);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
