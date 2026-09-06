import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Requires a signed-in Supabase user for all app pages. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.ready()) {
    await auth.initialize();
  }

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
};

/** Redirects authenticated users away from login/signup. */
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.ready()) {
    await auth.initialize();
  }

  if (auth.isAuthenticated()) {
    return router.createUrlTree(['/home']);
  }

  return true;
};
