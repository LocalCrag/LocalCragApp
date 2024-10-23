import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { switchMap, take } from 'rxjs/operators';
import { AppState } from '../../ngrx/reducers';
import { selectAuthState } from '../../ngrx/selectors/auth.selectors';

/**
 * Http interceptor that adds access tokens to requests.
 */
@Injectable()
export class JWTInterceptor implements HttpInterceptor {
  constructor(private store: Store<AppState>) {}

  /**
   * Intercepts http requests and adds the JWT header to them.
   *
   * @param request request to intercept.
   * @param next Http handler for the request.
   * @return Returns an Observable that resolves to an http event.
   */
  intercept(
    request: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return this.store.pipe(
      select(selectAuthState),
      take(1),
      switchMap((authState) => {
        if (authState.accessToken !== null) {
          request = request.clone({
            setHeaders: {
              Authorization: `Bearer ${authState.accessToken}`,
            },
          });
        }
        return next.handle(request);
      }),
    );
  }
}
