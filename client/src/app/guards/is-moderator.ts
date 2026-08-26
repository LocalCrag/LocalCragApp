import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { waitForAuthState } from './wait-for-auth';

/**
 * CanActivateFn for checking if a user is a moderator.
 */
export const isModerator: CanActivateFn = (): Observable<boolean> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  return waitForAuthState(store).pipe(
    map((authState) => {
      if (authState.user?.moderator) {
        return true;
      }
      if (authState.user) {
        router.navigate(['']);
      } else {
        router.navigate(['/login']);
      }
      return false;
    }),
  );
};
