// noinspection JSUnusedGlobalSymbols

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {AppState} from '../reducers';
import {tap} from 'rxjs/operators';
import {checkShowCookieAlert, cookiesAccepted, showCookieAlert,} from '../actions/app-level-alerts.actions';
import {toastNotification} from '../actions/notifications.actions';
import {NotificationIdentifier} from '../../utility/notifications/notification-identifier.enum';

/**
 * Declares effects for the app level alerts.
 */
@Injectable()
export class AppLevelAlertsEffects {
  /**
   * Checks the local storage for a flag indicating that the cookie alerts was already seen and accepted.
   * If it's not there, the alert is shown by dispatching a show action.
   */
  onCheckShowCookieAlert = createEffect(
    () =>
      this.actions$.pipe(
        ofType(checkShowCookieAlert),
        tap(() => {
          if (
            JSON.parse(localStorage.getItem('cookiesAccepted') as string) !==
            true
          ) {
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
          localStorage.setItem('cookiesAccepted', JSON.stringify(true));
          this.store.dispatch(
            toastNotification(NotificationIdentifier.COOKIES_ALLOWED),
          );
        }),
      ),
    { dispatch: false },
  );

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
  ) {}
}
