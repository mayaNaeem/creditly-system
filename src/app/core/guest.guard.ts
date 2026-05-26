import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, defaultRouteForRole } from './auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return router.createUrlTree([defaultRouteForRole(auth.role())]);
  }
  return true;
};
