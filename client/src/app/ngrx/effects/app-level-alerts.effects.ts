import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers';
import { tap } from 'rxjs/operators';
import {
  checkShowCookieAlert,
  cookiesAccepted,
  showCookieAlert,
} from '../actions/app-level-alerts.actions';
import { toastNotification } from '../actions/notifications.actions';
import {
  isLocalStorageAccessDenied,
  readLocalStorageItem,
  writeLocalStorageItem,
} from '../../utility/local-storage';

/**
 * Declares effects for the app level alerts.
 */
@Injectable()
export class AppLevelAlertsEffects {
  private actions$ = inject(Actions);
  private store = inject<Store<AppState>>(Store);

  /**
   * Checks the local storage for a flag indicating that the cookie alerts was already seen and accepted.
   * If it's not there, the alert is shown by dispatching a show action.
   */
  onCheckShowCookieAlert = createEffect(
    () =>
      this.actions$.pipe(
        ofType(checkShowCookieAlert),
        tap(() => {
          // A blocked document cannot store consent. The storage-access banner
          // explains that; the cookie alert would reappear on every load.
          if (isLocalStorageAccessDenied()) {
            return;
          }
          const accepted = readLocalStorageItem('cookiesAccepted');
          if (JSON.parse(accepted ?? 'null') !== true) {
            this.store.dispatch(showCookieAlert());
          }
        }),
      ),
    { dispatch: false },
  );

  /**
   * Sets the local storage flag which stores that the cookie alerts was seen and accepted.
   */
  onCookiesAccepted = createEffect(
    () =>
      this.actions$.pipe(
        ofType(cookiesAccepted),
        tap(() => {
          writeLocalStorageItem('cookiesAccepted', JSON.stringify(true));
          this.store.dispatch(toastNotification('COOKIES_ALLOWED'));
        }),
      ),
    { dispatch: false },
  );
}
