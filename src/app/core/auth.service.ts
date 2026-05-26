import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type AppRole = 'ADMIN' | 'MANAGER' | 'USER' | 'BANKER';

export interface UserSession {
  id: string;
  email: string;
  role: AppRole;
  bankId: string | null;
}

interface LoginResponse {
  token: string;
  user: UserSession;
}

const TOKEN_KEY = 'creditly_token';
const USER_KEY = 'creditly_user';

export function defaultRouteForRole(role: AppRole | null): string {
  return role === 'BANKER' ? '/auctions' : '/accounts';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly browserStorageAvailable = typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  private readonly tokenSig = signal<string | null>(this.browserStorageAvailable ? localStorage.getItem(TOKEN_KEY) : null);
  private readonly userSig = signal<UserSession | null>(this.browserStorageAvailable ? this.readUser() : null);

  readonly token = this.tokenSig.asReadonly();
  readonly user = this.userSig.asReadonly();
  readonly role = computed(() => this.userSig()?.role ?? null);

  isAuthenticated(): boolean {
    return !!this.tokenSig();
  }

  hasRole(roles: AppRole[]): boolean {
    const r = this.userSig()?.role;
    return !!r && roles.includes(r);
  }

  login(email: string, password: string) {
    const payload = { email, password };
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, payload).pipe(
      tap((res) => {
        if (this.browserStorageAvailable) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        }
        this.tokenSig.set(res.token);
        this.userSig.set(res.user);
        this.router.navigateByUrl(defaultRouteForRole(res.user.role));
      }),
    );
  }

  // Development convenience: create/find a dev user and return a session
  devLogin(username: string, password?: string) {
    const body: any = { username };
    if (password) body.password = password;
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/dev-login`, body).pipe(
      tap((res) => {
        if (this.browserStorageAvailable) {
          localStorage.setItem(TOKEN_KEY, res.token);
          localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        }
        this.tokenSig.set(res.token);
        this.userSig.set(res.user);
        this.router.navigateByUrl(defaultRouteForRole(res.user.role));
      }),
    );
  }

  logout(): void {
    if (this.browserStorageAvailable) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.tokenSig.set(null);
    this.userSig.set(null);
    this.router.navigateByUrl('/login');
  }

  private readUser(): UserSession | null {
    if (!this.browserStorageAvailable) {
      return null;
    }

    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as UserSession;
    } catch {
      return null;
    }
  }
}
