import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { guestGuard } from './core/guest.guard';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { AccountListComponent } from './pages/accounts/account-list.component';
import { AccountDetailComponent } from './pages/accounts/account-detail.component';
import { BankerAuctionsComponent } from './pages/auctions/banker-auctions.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'accounts' },
      { path: 'accounts', component: AccountListComponent },
      { path: 'accounts/:id', component: AccountDetailComponent },
      { path: 'auctions', component: BankerAuctionsComponent },
      { path: 'analytics', component: AnalyticsComponent },
    ],
  },
  { path: '**', redirectTo: 'accounts' },
];
