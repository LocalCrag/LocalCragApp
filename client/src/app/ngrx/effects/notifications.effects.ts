// noinspection JSUnusedGlobalSymbols

import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { AppNotificationsService } from '../../services/core/app-notifications.service';
import { toastNotification } from '../actions/notifications.actions';

/**
 * Effects for notification actions.
 */
@Injectable()
export class NotificationsEffects {
  private notificationsService = inject(AppNotificationsService);
  private actions$ = inject(Actions);

  /**
   * Pushes a toast notification via the notification service when the according action is triggered.
   */
  onToastNotification = createEffect(
    () =>
      this.actions$.pipe(
        ofType(toastNotification),
        tap((action) => {
          this.notificationsService.toast(
            action.notificationKey,
            action.titleParams,
            action.messageParams,
          );
        }),
      ),
    { dispatch: false },
  );
}
