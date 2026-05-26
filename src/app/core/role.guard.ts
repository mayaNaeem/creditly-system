import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService, AppRole, defaultRouteForRole } from './auth.service';

export function roleGuard(allowed: AppRole[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }
    if (auth.hasRole(allowed)) {
      return true;
    }
    return router.createUrlTree([defaultRouteForRole(auth.role())]);
  };
}
