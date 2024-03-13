import {Injectable} from '@angular/core';
import {HttpErrorResponse} from '@angular/common/http';
import {AppNotificationsService} from './app-notifications.service';
import {Store} from '@ngrx/store';
import {NotificationIdentifier} from '../../utility/notifications/notification-identifier.enum';
import {AppState} from '../../ngrx/reducers';
import {toastNotification} from '../../ngrx/actions/notifications.actions';

/**
 * A simple error handling service for logging and messaging.
 */
@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor(private store: Store<AppState>) {
  }

  /**
   * Handles an http error by logging the error for debugging purposes and alerting a message if the error is known.
   *
   * @param  error The error to handle.
   */
  public handleHttpError(error: HttpErrorResponse) {
    const errIdentifier = error.error['labnodeErrCode'] || error.error['message'] || null;
    if (errIdentifier && errIdentifier in NotificationIdentifier) {
      this.store.dispatch(toastNotification(NotificationIdentifier[errIdentifier as keyof typeof NotificationIdentifier]));
    }
    console.error(error);
  }

}
