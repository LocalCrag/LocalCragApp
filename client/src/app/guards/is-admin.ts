import { inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import {
  selectAuthState,
  selectIsAdmin,
  selectIsLoggedIn,
} from '../ngrx/selectors/auth.selectors';

/**
 * CanActivateFn for checking if a user is an admin.
 * @param route Route to navigate to.
 * @param state Router state.
 */
export const isAdmin: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
): Observable<boolean> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  return store.pipe(
    select(selectAuthState),
    map((authState) => {
      if (authState.isLoggedIn && authState.user.admin) {
        return true;
      } else {
        if (authState.user) {
          router.navigate(['']);
        } else {
          router.navigate(['/login']);
        }
      }
      return false;
    }),
  );
};
