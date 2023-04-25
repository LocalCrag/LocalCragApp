// noinspection JSUnusedGlobalSymbols

import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {tap} from 'rxjs/operators';
import {AppNotificationsService} from '../../services/core/app-notifications.service';
import {toastNotification} from '../actions/notifications.actions';

/**
 * Effects for notification actions.
 */
@Injectable()
export class NotificationsEffects {

  /**
   * Pushes a toast notification via the notification service when the according action is triggered.
   */
  onToastNotification = createEffect(() => this.actions$.pipe(
    ofType(toastNotification),
    tap(action => {
      this.notificationsService.toast(action.identifier, action.titleParams, action.messageParams);
    })
  ), {dispatch: false});

  constructor(
    private notificationsService: AppNotificationsService,
    private actions$: Actions) {
  }

}
