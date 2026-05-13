import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/http-error';

type AccountDetail = Record<string, unknown> & { id: string; auctions?: { id: string; status: string }[] };

type TimelineEvent = {
  id: string;
  type: string;
  createdBy: string;
  createdAt: string;
  syncStatus?: string | null;
};

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <p><a routerLink="/accounts">← Accounts</a></p>
    @if (loading()) {
      <p>Loading…</p>
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else if (account()) {
      @let a = account()!;
      <h1>Account</h1>
      <p class="mono muted">{{ a.id }}</p>
      <section class="card">
        <h2>Profile</h2>
        @if (isBanker()) {
          <p class="muted">Banker view: sensitive fields are hidden by the API.</p>
          <dl>
            <dt>Status</dt>
            <dd>{{ a['status'] }}</dd>
            <dt>Auction status</dt>
            <dd>{{ a['auctionStatus'] ?? '—' }}</dd>
          </dl>
        } @else {
          <dl>
            <dt>Customer</dt>
            <dd>{{ a['customerName'] }}</dd>
            <dt>Email</dt>
            <dd>{{ a['email'] }}</dd>
            <dt>Phone</dt>
            <dd>{{ a['phone'] }}</dd>
            <dt>Status</dt>
            <dd>{{ a['status'] }}</dd>
            <dt>Last activity</dt>
            <dd>{{ formatDate(a['lastActivity']) }}</dd>
            <dt>High activity</dt>
            <dd>{{ a['isHighActivity'] ? 'Yes' : 'No' }}</dd>
          </dl>
        }
      </section>

      @if (canManageAuctions()) {
        <section class="card">
          <h2>Auctions</h2>
          @if (latestAuction(); as auc) {
            <p>
              Latest: <strong>{{ auc.status }}</strong>
              @if (auc.status === 'OPEN') {
                <button type="button" class="secondary" (click)="closeAuction(auc.id)" [disabled]="busy()">
                  Close auction
                </button>
              }
            </p>
          } @else {
            <p class="muted">No auctions yet.</p>
          }
          <button type="button" (click)="openAuction()" [disabled]="busy()">Open 3-day auction</button>
        </section>
      }

      @if (!isBanker()) {
        <section class="card">
          <h2>Events</h2>
          @if (eventsLoading()) {
            <p>Loading events…</p>
          } @else {
            <ul class="timeline">
              @for (ev of events(); track ev.id) {
                <li>
                  <strong>{{ ev.type }}</strong>
                  <span class="muted"> · {{ ev.createdAt | date: 'medium' }}</span>
                  @if (ev.syncStatus) {
                    <span class="pill">{{ ev.syncStatus }}</span>
                  }
                </li>
              } @empty {
                <li class="muted">No events yet.</li>
              }
            </ul>
          }
          @if (canPostEvents()) {
            <div class="row">
              <select #evType>
                <option value="note_added">note_added</option>
                <option value="document_uploaded">document_uploaded</option>
                <option value="status_changed">status_changed</option>
              </select>
              <button type="button" (click)="postEvent(evType.value)" [disabled]="busy()">Add event</button>
            </div>
          }
        </section>
      }
    }
  `,
  styles: `
    h1 {
      margin-bottom: 0.25rem;
    }
    .card {
      margin-top: 1.25rem;
      padding: 1rem 1.25rem;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface);
    }
    h2 {
      margin: 0 0 0.75rem;
      font-size: 1rem;
    }
    dl {
      display: grid;
      grid-template-columns: 10rem 1fr;
      gap: 0.35rem 1rem;
      margin: 0;
    }
    dt {
      color: var(--muted);
      font-size: 0.85rem;
    }
    dd {
      margin: 0;
    }
    .timeline {
      list-style: none;
      padding: 0;
      margin: 0 0 1rem;
    }
    .timeline li {
      padding: 0.35rem 0;
      border-bottom: 1px solid var(--border);
    }
    .row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: center;
    }
    select {
      padding: 0.45rem 0.6rem;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    button {
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      border: none;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button.secondary {
      background: #475569;
      margin-left: 0.5rem;
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .pill {
      font-size: 0.7rem;
      margin-left: 0.35rem;
      padding: 0.1rem 0.4rem;
      border-radius: 4px;
      background: #e2e8f0;
    }
  `,
})
export class AccountDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  readonly auth = inject(AuthService);

  readonly account = signal<AccountDetail | null>(null);
  readonly events = signal<TimelineEvent[]>([]);
  readonly loading = signal(true);
  readonly eventsLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Missing account id');
      this.loading.set(false);
      this.eventsLoading.set(false);
      return;
    }
    const role = this.auth.user()?.role;
    this.http.get<AccountDetail>(`${environment.apiBaseUrl}/accounts/${id}`).subscribe({
      next: (account) => {
        this.account.set(account);
        this.loading.set(false);
        if (role === 'BANKER') {
          this.events.set([]);
          this.eventsLoading.set(false);
        }
      },
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.loading.set(false);
        this.eventsLoading.set(false);
      },
    });
    if (role !== 'BANKER') {
      this.http.get<TimelineEvent[]>(`${environment.apiBaseUrl}/accounts/${id}/events`).subscribe({
        next: (events) => {
          this.events.set(events);
          this.eventsLoading.set(false);
        },
        error: (e) => {
          this.error.set(getApiErrorMessage(e));
          this.eventsLoading.set(false);
        },
      });
    }
  }

  isBanker(): boolean {
    return this.auth.user()?.role === 'BANKER';
  }

  canManageAuctions(): boolean {
    return this.auth.hasRole(['ADMIN', 'MANAGER']);
  }

  canPostEvents(): boolean {
    return this.auth.hasRole(['ADMIN', 'MANAGER', 'USER']);
  }

  latestAuction(): { id: string; status: string } | null {
    const auc = this.account()?.auctions?.[0];
    if (!auc) {
      return null;
    }
    return { id: auc.id, status: auc.status };
  }

  formatDate(value: unknown): string {
    if (value == null || value === '') {
      return '—';
    }
    const d = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value instanceof Date ? value : null;
    if (!d || Number.isNaN(d.getTime())) {
      return '—';
    }
    return d.toLocaleString();
  }

  openAuction(): void {
    const id = this.account()?.id;
    if (!id) {
      return;
    }
    this.busy.set(true);
    this.http.post(`${environment.apiBaseUrl}/accounts/${id}/auctions`, {}).subscribe({
      next: () => this.reload(id),
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.busy.set(false);
      },
    });
  }

  closeAuction(auctionId: string): void {
    this.busy.set(true);
    this.http.post(`${environment.apiBaseUrl}/auctions/${auctionId}/close`, {}).subscribe({
      next: () => this.reload(this.account()!.id),
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.busy.set(false);
      },
    });
  }

  postEvent(type: string): void {
    const id = this.account()?.id;
    if (!id) {
      return;
    }
    this.busy.set(true);
    this.http
      .post(`${environment.apiBaseUrl}/events`, { accountId: id, type })
      .subscribe({
        next: () => this.reload(id),
        error: (e) => {
          this.error.set(getApiErrorMessage(e));
          this.busy.set(false);
        },
      });
  }

  private reload(accountId: string): void {
    const role = this.auth.user()?.role;
    this.http.get<AccountDetail>(`${environment.apiBaseUrl}/accounts/${accountId}`).subscribe({
      next: (account) => {
        this.account.set(account);
        this.busy.set(false);
      },
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.busy.set(false);
      },
    });
    if (role !== 'BANKER') {
      this.http.get<TimelineEvent[]>(`${environment.apiBaseUrl}/accounts/${accountId}/events`).subscribe({
        next: (events) => this.events.set(events),
        error: (e) => this.error.set(getApiErrorMessage(e)),
      });
    }
  }
}
