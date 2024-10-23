import {inject} from '@angular/core';
import {CanActivateFn, Router,} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppState} from '../ngrx/reducers';
import {selectAuthState,} from '../ngrx/selectors/auth.selectors';

/**
 * CanActivateFn for checking if a user is a moderator.
 */
export const isModerator: CanActivateFn = (): Observable<boolean> => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  return store.pipe(
    select(selectAuthState),
    map((authState) => {
      if (authState.isLoggedIn && authState.user.moderator) {
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
