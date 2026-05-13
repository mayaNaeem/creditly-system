import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/http-error';

type OpenAuction = {
  id: string;
  accountId: string;
  status: string;
  startDate: string;
  endDate: string;
};

@Component({
  selector: 'app-banker-auctions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <h1>Open auctions</h1>
    <p class="muted">Blind model: submit one offer per auction for your bank.</p>
    @if (loading()) {
      <p>Loading…</p>
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else if (rows().length === 0) {
      <p class="muted">No eligible open auctions right now.</p>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Auction</th>
              <th>Account</th>
              <th>Ends</th>
              <th>Your offer (%)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of rows(); track a.id) {
              <tr>
                <td class="mono">{{ a.id }}</td>
                <td class="mono">{{ a.accountId }}</td>
                <td>{{ a.endDate | date: 'medium' }}</td>
                <td>
                  <input type="number" step="0.01" min="0.01" max="100" [(ngModel)]="rates[a.id]" />
                </td>
                <td>
                  <button type="button" (click)="submit(a.id)" [disabled]="busy() === a.id">Submit</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    <p><a routerLink="/accounts">← Accounts</a></p>
  `,
  styles: `
    h1 {
      margin-bottom: 0.25rem;
    }
    .table-wrap {
      overflow: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
      margin-top: 1rem;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }
    th,
    td {
      padding: 0.6rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: #f8fafc;
    }
    input[type='number'] {
      width: 6rem;
      padding: 0.35rem;
      border-radius: 6px;
      border: 1px solid var(--border);
    }
    button {
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      border: none;
      background: var(--accent);
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.6;
    }
  `,
})
export class BankerAuctionsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly rows = signal<OpenAuction[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rates: Record<string, number> = {};
  readonly busy = signal<string | null>(null);

  ngOnInit(): void {
    if (this.auth.user()?.role !== 'BANKER') {
      this.error.set('This page is for bankers only.');
      this.loading.set(false);
      return;
    }
    this.http.get<OpenAuction[]>(`${environment.apiBaseUrl}/auctions/open`).subscribe({
      next: (list) => {
        this.rows.set(list);
        for (const a of list) {
          this.rates[a.id] = 5.5;
        }
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  submit(auctionId: string): void {
    const rate = this.rates[auctionId];
    if (rate == null || rate <= 0) {
      this.error.set('Enter a positive interest rate.');
      return;
    }
    this.error.set(null);
    this.busy.set(auctionId);
    this.http.post(`${environment.apiBaseUrl}/auctions/${auctionId}/offers`, { interestRate: rate }).subscribe({
      next: () => {
        this.rows.update((list) => list.filter((x) => x.id !== auctionId));
        this.busy.set(null);
      },
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.busy.set(null);
      },
    });
  }
}
