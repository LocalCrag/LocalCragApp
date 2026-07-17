import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { AppState } from '../../ngrx/reducers';
import { toastNotification } from '../../ngrx/actions/notifications.actions';
import { NOTIFICATIONS } from '../../utility/notifications';
import {
  isNetworkConnectivityError,
  isOfflineRelatedError,
} from '../../utility/sentry-network-error';
import {
  hideOfflineAlert,
  showOfflineAlert,
} from '../../ngrx/actions/app-level-alerts.actions';

/**
 * Logging, toast notifications, and offline-banner triggers for client errors.
 *
 * Offline banner: shown on real request/chunk failures (not `window.offline` alone),
 * because browser online/offline only reflects a network interface, not API/asset
 * reachability. See OfflineAlertComponent for the full show/hide rationale.
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService {
  private store = inject<Store<AppState>>(Store);

  /**
   * Handles an http error by logging the error for debugging purposes and alerting a message if the error is known.
   * Network failures (status 0) show the offline banner.
   *
   * @param  error The error to handle.
   */
  public handleHttpError(error: HttpErrorResponse) {
    if (isNetworkConnectivityError(error)) {
      this.store.dispatch(showOfflineAlert());
      console.error(error);
      return;
    }

    const errIdentifier = error.error?.['message'] || null;
    if (errIdentifier && errIdentifier in NOTIFICATIONS) {
      this.store.dispatch(toastNotification(errIdentifier));
    }
    console.error(error);
  }

  /**
   * Shows the offline banner for network HTTP failures and lazy chunk load errors.
   * Primary show path for non-HTTP client failures (e.g. dynamic import / chunk load).
   */
  public handleClientError(error: unknown) {
    if (isOfflineRelatedError(error)) {
      this.store.dispatch(showOfflineAlert());
    }
  }

  /**
   * Clears the offline banner after a successful HTTP response.
   * Stronger “back online” signal than `window.online` alone (proves the server is reachable).
   */
  public handleHttpSuccess() {
    this.store.dispatch(hideOfflineAlert());
  }
}
