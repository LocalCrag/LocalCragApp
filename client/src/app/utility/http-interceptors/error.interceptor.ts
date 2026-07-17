import { Injectable, inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ErrorHandlerService } from '../../services/core/error-handler.service';

/**
 * Http interceptor for connectivity-aware error handling.
 *
 * Shows the offline banner on network HTTP failures and clears it on successful
 * responses (stronger “back online” signal than `window.online` alone).
 * See OfflineAlertComponent for why we key off requests rather than window events.
 */
@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
  private errorHandler = inject(ErrorHandlerService);

  /**
   * Intercepts http events: shows offline alert on network failures, clears it on success.
   *
   * @param request Request that is intercepted.
   * @param next Http handler for handling the error.
   * @return Returns an observable that resolves to a http event.
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      tap({
        next: (event) => {
          if (event.type === HttpEventType.Response) {
            this.errorHandler.handleHttpSuccess();
          }
        },
        error: (err: any) => {
          if (err instanceof HttpErrorResponse) {
            this.errorHandler.handleHttpError(err);
          }
        },
      }),
    );
  }
}
