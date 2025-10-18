import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from '../../ngrx/reducers';
import { toastNotification } from '../../ngrx/actions/notifications.actions';
import { NOTIFICATIONS } from '../../utility/notifications';

/**
 * A simple error handling service for logging and messaging.
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private store = inject<Store<AppState>>(Store);

  /**
   * Handles an http error by logging the error for debugging purposes and alerting a message if the error is known.
   *
   * @param  error The error to handle.
   */
  public handleHttpError(error: HttpErrorResponse) {
    const errIdentifier = error.error['message'] || null;
    if (errIdentifier && errIdentifier in NOTIFICATIONS) {
      this.store.dispatch(toastNotification(errIdentifier));
    }
    console.error(error);
  }
}
