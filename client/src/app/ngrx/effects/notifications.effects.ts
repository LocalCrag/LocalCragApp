// noinspection JSUnusedGlobalSymbols

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { merge, EMPTY } from 'rxjs';
import {
  catchError,
  exhaustMap,
  filter,
  map,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import { AppNotificationsService } from '../../services/core/app-notifications.service';
import { NotificationsService } from '../../services/crud/notifications.service';
import { newAuthCredentials } from '../actions/auth.actions';
import {
  loadUnreadNotificationCount,
  loadUnreadNotificationCountSuccess,
  toastNotification,
} from '../actions/notifications.actions';
import { AppState } from '../reducers';
import { selectIsLoggedIn } from '../selectors/auth.selectors';

/**
 * Effects for notification actions.
 */
@Injectable()
export class NotificationsEffects {
  private appNotifications = inject(AppNotificationsService);
  private notificationsCrud = inject(NotificationsService);
  private actions$ = inject(Actions);
  private store = inject<Store<AppState>>(Store);

  /**
   * Pushes a toast notification via the notification service when the according action is triggered.
   */
  onToastNotification = createEffect(
    () =>
      this.actions$.pipe(
        ofType(toastNotification),
        tap((action) => {
          this.appNotifications.toast(
            action.notificationKey,
            action.titleParams,
            action.messageParams,
          );
        }),
      ),
    { dispatch: false },
  );

  /**
   * Loads unread inbox notification count from the API when requested, after login, or when dismiss/mutations fire.
   * Uses exhaustMap so concurrent triggers (e.g. bell and list mounting together) share one in-flight request.
   */
  refreshUnreadNotificationCount = createEffect(() =>
    merge(
      this.actions$.pipe(ofType(loadUnreadNotificationCount)),
      this.actions$.pipe(ofType(newAuthCredentials)),
      this.notificationsCrud.notificationUpdates$,
    ).pipe(
      withLatestFrom(this.store.select(selectIsLoggedIn)),
      filter(([, loggedIn]) => loggedIn),
      exhaustMap(() =>
        this.notificationsCrud.getNotificationCount().pipe(
          map((count) => loadUnreadNotificationCountSuccess({ count })),
          catchError(() => EMPTY),
        ),
      ),
    ),
  );
}
