import {inject} from '@angular/core';
import {CanActivateFn, Router,} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppState} from '../ngrx/reducers';
import {selectIsLoggedIn} from '../ngrx/selectors/auth.selectors';

/**
 * CanActivateFn for checking if a user is logged in.
 */
export const isLoggedIn: CanActivateFn = (): Observable<boolean> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  return store.pipe(
    select(selectIsLoggedIn),
    map((isLoggedInValue) => {
      if (isLoggedInValue) {
        return true;
      }
      router.navigate(['login']);
      return false;
    }),
  );
};
