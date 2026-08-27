import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { AuthState } from '../ngrx/reducers/auth.reducers';
import { selectAuthState } from '../ngrx/selectors/auth.selectors';

/**
 * Emits once session restore via GET /api/me has completed (success or failure).
 * Auth guards must wait for this so a cold start does not treat "user still
 * null" as logged out before cookies are checked.
 */
export function waitForAuthState(
  store: Store<AppState>,
): Observable<AuthState> {
  return store.pipe(
    select(selectAuthState),
    filter((authState) => authState.authResolved),
    take(1),
  );
}
