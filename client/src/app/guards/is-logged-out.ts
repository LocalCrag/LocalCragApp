import {inject} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot,} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppState} from '../ngrx/reducers';
import {selectIsLoggedOut,} from '../ngrx/selectors/auth.selectors';

/**
 * CanActivateFn for checking if a user is logged out.
 * @param _route Route to navigate to.
 * @param _state Router state.
 */
export const isLoggedOut: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot,
): Observable<boolean> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  return store.pipe(
    select(selectIsLoggedOut),
    map((isLoggedOutValue) => {
      if (isLoggedOutValue) {
        return true;
      }
      router.navigate(['']);
      return false;
    }),
  );
};
