import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest,} from '@angular/common/http';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ErrorHandlerService} from '../../services/core/error-handler.service';

/**
 * Http interceptor for handling errors.
 */
@Injectable()
export class ErrorHandlerInterceptor implements HttpInterceptor {
  constructor(private errorHandler: ErrorHandlerService) {}

  /**
   * Intercepts an http error and passes it to the error handler.
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
      tap(
        (_event: HttpEvent<any>) => {},
        (err: any) => {
          if (err instanceof HttpErrorResponse) {
            this.errorHandler.handleHttpError(err);
          }
        },
      ),
    );
  }
}
