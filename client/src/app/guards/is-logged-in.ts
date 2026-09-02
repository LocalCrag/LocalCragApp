import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { waitForAuthState } from './wait-for-auth';

/**
 * CanActivateFn for checking if a user is logged in.
 */
export const isLoggedIn: CanActivateFn = (): Observable<boolean> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  return waitForAuthState(store).pipe(
    map((authState) => {
      if (authState.user != null) {
        return true;
      }
      router.navigate(['login']);
      return false;
    }),
  );
};
