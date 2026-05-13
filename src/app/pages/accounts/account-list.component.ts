import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { getApiErrorMessage } from '../../core/http-error';

/** Account row shape varies by role (banker gets public DTO). */
export type AccountRow = Record<string, unknown> & { id: string };

@Component({
  selector: 'app-account-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1>Accounts</h1>
    <p class="muted">Role-based list from the Creditly API.</p>
    @if (loading()) {
      <p>Loading…</p>
    } @else if (error()) {
      <p class="error">{{ error() }}</p>
    } @else if (accounts().length === 0) {
      <p class="muted">No accounts visible for your role.</p>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              @if (showSensitive()) {
                <th>Customer</th>
                <th>Email</th>
                <th>Status</th>
                <th>High activity</th>
              } @else {
                <th>Status</th>
                <th>Auction</th>
              }
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (a of accounts(); track a.id) {
              <tr>
                <td class="mono">{{ a.id }}</td>
                @if (showSensitive()) {
                  <td>{{ a['customerName'] }}</td>
                  <td>{{ a['email'] }}</td>
                  <td>{{ a['status'] }}</td>
                  <td>{{ a['isHighActivity'] ? 'Yes' : 'No' }}</td>
                } @else {
                  <td>{{ a['status'] }}</td>
                  <td>{{ a['auctionStatus'] ?? '—' }}</td>
                }
                <td><a [routerLink]="['/accounts', a.id]">View</a></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: `
    h1 {
      margin: 0 0 0.25rem;
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
      font-weight: 600;
    }
    .mono {
      font-family: ui-monospace, monospace;
      font-size: 0.75rem;
      max-width: 8rem;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `,
})
export class AccountListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly accounts = signal<AccountRow[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  showSensitive(): boolean {
    const r = this.auth.user()?.role;
    return r === 'ADMIN' || r === 'MANAGER' || r === 'USER';
  }

  ngOnInit(): void {
    this.http.get<AccountRow[]>(`${environment.apiBaseUrl}/accounts`).subscribe({
      next: (rows) => {
        this.accounts.set(rows);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(getApiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }
}
