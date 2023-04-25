import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {mergeMap, take} from 'rxjs/operators';
import * as moment from 'moment';
import {unixToMoment} from '../operators/unix-to-moment';
import {Actions, ofType} from '@ngrx/effects';
import {AppState} from '../../ngrx/reducers';
import {selectAccessTokenExpires} from '../../ngrx/selectors/auth.selectors';
import {newAuthCredentials, refreshAccessToken, refreshAccessTokenFailed} from '../../ngrx/actions/auth.actions';

/**
 * Http interceptor that checks if the token is still valid and prepends a refresh token request if it is not.
 * Despite the refresh token cycles, expired tokens can be present if the app is kept open in the browser but the browser is inactive.
 */
@Injectable()
export class RefreshTokenInterceptor implements HttpInterceptor {

  constructor(private store: Store<AppState>,
              private actions$: Actions) {
  }

  /**
   * Intercepts http requests and eventually prepends additional refresh token requests if token is not valid anymore.
   *
   * @param request request to intercept.
   * @param next Http handler for the request.
   * @return Returns an Observable that resolves to an http event.
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return this.store.pipe(
      select(selectAccessTokenExpires),
      unixToMoment,
      take(1),
      mergeMap(accessTokenExpires => {
        if (accessTokenExpires === null || accessTokenExpires.isAfter(moment())) {
          return next.handle(request);
        } else {
          this.store.dispatch(refreshAccessToken());
          return this.actions$.pipe(
            ofType(newAuthCredentials, refreshAccessTokenFailed),
            take(1),
            mergeMap(action => {
              if (action.type === newAuthCredentials.type) {
                return next.handle(request);
              }
              return throwError(new HttpErrorResponse({error: {}}));
            })
          );
        }
      }
      )
    );
  }


}
