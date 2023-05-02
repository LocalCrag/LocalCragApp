import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {select, Store} from '@ngrx/store';
import {AppState} from '../reducers';
import * as AuthActions from '../actions/auth.actions';
import {
  autoLoginFailed,
  login,
  logout,
  newAuthCredentials,
  refreshAccessToken,
  startAccessTokenRefreshTimer,
  startRefreshTokenAboutToExpireTimer,
  tryAutoLogin
} from '../actions/auth.actions';
import {catchError, filter, map, mergeMap, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {AuthCrudService} from '../../services/crud/auth-crud.service';
import {Router} from '@angular/router';
import {AppNotificationsService} from '../../services/core/app-notifications.service';
import {forkJoin, of, timer} from 'rxjs';
import * as moment from 'moment';
import {
  selectAccessTokenExpires,
  selectAuthState,
  selectIsLoggedOut,
  selectRefreshTokenExpires
} from '../selectors/auth.selectors';
import {HttpErrorResponse} from '@angular/common/http';
import {bigIntTimer} from '../../utility/observables/bigint-timer';
import {showRefreshTokenAboutToExpireAlert} from '../actions/app-level-alerts.actions';
import {unixToMoment} from '../../utility/operators/unix-to-moment';
import {toastNotification} from '../actions/notifications.actions';
import {NotificationIdentifier} from '../../utility/notifications/notification-identifier.enum';
import {LoginResponse} from '../../models/login-response';

/**
 * Time before expiry before an access token gets refreshed. Accounts for an approximate server response delay of the refresh request
 * so that there is theoretically no time with an invalid token.
 */
const REFRESH_ACCESS_TOKEN_BUFFER_TIME = 10 * 1000;
/**
 * A warning that the refresh token is about to expire is shown this amount of time before its expiry.
 */
const REFRESH_TOKEN_EXPIRY_WARNING_TIME = 2 * 60 * 1000;

// noinspection JSUnusedGlobalSymbols
/**
 * Effects that handle auth actions.
 */
@Injectable()
export class AuthEffects {

  /**
   * Calls the password forgotten route to send a reset password mail and notifies the app about success or failure.
   */
  onForgotPassword = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.forgotPassword),
    mergeMap(action =>
      this.authCrud.forgotPassword(action.email).pipe(
        map(() => AuthActions.forgotPasswordSuccess()),
        catchError((err) => {
          if (err === 'USER_NOT_ACTIVATED') {
            this.store.dispatch(toastNotification(NotificationIdentifier.USER_NOT_ACTIVATED));
          }
          return of(AuthActions.forgotPasswordError());
        })
      )
    )
  ));

  /**
   * Notifies the user about a successful password forgotten request.
   */
  onForgotPasswordSuccess = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.forgotPasswordSuccess),
    tap(() => {
      this.router.navigate(['/', 'forgot-password-check-mailbox']);
      this.store.dispatch(toastNotification(NotificationIdentifier.FORGOT_PASSWORD_SUCCESS));
    })
  ), {dispatch: false});


  /**
   * Sends a reset password request to the server and notifies the app about success or failure.
   */
  onResetPassword = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.resetPassword),
    mergeMap(action =>
      this.authCrud.resetPassword(action.password, action.resetPasswordHash).pipe(
        map((response: LoginResponse) => {
          this.store.dispatch(newAuthCredentials({
            loginResponse: response,
            fromAutoLogin: false,
            initialCredentials: true
          }));
          return AuthActions.resetPasswordSuccess();
        }),
        catchError((err) => {
          if (err === 'USER_NOT_ACTIVATED') {
            this.store.dispatch(toastNotification(NotificationIdentifier.USER_NOT_ACTIVATED));
          }
          return of(AuthActions.resetPasswordError());
        })
      )
    )
  ));

  /**
   * Notifies the user about a successful reset password request and navigates the user to the main page.
   */
  onResetPasswordSuccess = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.resetPasswordSuccess),
    tap(() => {
      this.router.navigate(['']);
      this.store.dispatch(toastNotification(NotificationIdentifier.RESET_PASSWORD_SUCCESS));
    })
  ), {dispatch: false});

  /**
   * Sends a login request and notifies the app about success or failure.
   */
  onLogin = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.login),
    mergeMap(action =>
      this.authCrud.login(action.email, action.password).pipe(
        map(loginResponse => AuthActions.loginSuccess({loginResponse})),
        catchError(() => of(AuthActions.loginError()))
      )
    )
  ));

  /**
   * Notifies the user about successful login and navigates him to the start page.
   * Also, the new authorization credentials are stored for later use.
   */
  onLoginSuccess = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.loginSuccess),
    map(action => {
      this.router.navigate(['']);
      this.store.dispatch(toastNotification(NotificationIdentifier.LOGIN_SUCCESS));
      return newAuthCredentials({loginResponse: action.loginResponse, fromAutoLogin: false, initialCredentials: true});
    })
  ));

  /**
   * Stores new authorization credentials and performs actions to keep the session alive:
   *  - Store the credentials in the local storage for enabling auto login
   *  - Start a timer for refreshing the access token
   *  - Start a timer for notifying the user that the refresh token will expire soon (he has to re-login then)
   */
  onNewAuthCredentials = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.newAuthCredentials),
    withLatestFrom(
      this.store.pipe(select(selectAuthState)),
      this.store.pipe(select(selectRefreshTokenExpires), unixToMoment),
    ),
    map(([action, authState, refreshTokenExpiresValue]) => {
      // Store the credentials in the local storage for enabling auto login
      const autoLoginObject: LoginResponse = {
        accessToken: authState.accessToken,
        refreshToken: authState.refreshToken,
        user: authState.user,
        message: '',
      };
      localStorage.setItem('LocalCragAuth', JSON.stringify(autoLoginObject));
      // Start a timer for refreshing the access token
      if (action.loginResponse.accessToken !== null) {
        this.store.dispatch(startAccessTokenRefreshTimer());
      }
      // If credentials came from auto login we need to check if the old token is still valid
      if (action.fromAutoLogin) {
        if (!refreshTokenExpiresValue.isAfter(moment())) {
          this.store.dispatch(autoLoginFailed());
        } else {
          this.store.dispatch(refreshAccessToken());
          if (this.router.url === '/login') {
            this.router.navigate(['']);
          }
        }
      }
      // We only need to start this timer one time in a session. Either on login or on auto login
      if (action.initialCredentials) {
        this.store.dispatch(startRefreshTokenAboutToExpireTimer());
      }
    })
  ), {dispatch: false});


  /**
   * Starts the access token refresh timer which will notify the app about a necessary access token refresh before the token expires.
   */
  onStartAccessTokenRefreshTimer = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.startAccessTokenRefreshTimer),
    withLatestFrom(this.store.pipe(select(selectAccessTokenExpires), unixToMoment)),
    tap(([_action, accessTokenExpiresValue]) => {
      const now = moment();
      const validityDelta = accessTokenExpiresValue.diff(now);
      if (validityDelta > 0) {
        timer(validityDelta - REFRESH_ACCESS_TOKEN_BUFFER_TIME).pipe(
          // Cancel the timer when the user logs out
          takeUntil(this.store.pipe(select(selectIsLoggedOut), filter(isLoggedOutValue => isLoggedOutValue))),
          // Or when he refreshes the login
          takeUntil(this.actions$.pipe(ofType(login)))
        ).subscribe(() => {
          this.store.dispatch(refreshAccessToken());
        });
      }
    })
  ), {dispatch: false});

  /**
   * Refreshes the access token by using the refresh token.
   */
  onRefreshAccessToken = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.refreshAccessToken),
    withLatestFrom(this.store.pipe(select(selectAuthState))),
    mergeMap(([_action, authState]) =>
      this.authCrud.loginRefresh(authState.refreshToken).pipe(
        map(response => newAuthCredentials({loginResponse: response, fromAutoLogin: false, initialCredentials: false})),
        catchError((err: HttpErrorResponse) => {
          // When we end up here, the token is either invalid or the server is offline
          if (err.status === 0) {
            // We just notify here and don't force logout the user as there might be some unsaved work and the server might recover.
            this.store.dispatch(toastNotification(NotificationIdentifier.UNKNOWN_AUTHENTICATION_ERROR));
          }
          return of(AuthActions.refreshAccessTokenFailed());
        })
      )
    )
  ));

  /**
   * Performs a logout access and logout refresh request and notifies the app about success or failure.
   */
  onLogout = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.logout),
    withLatestFrom(this.store.pipe(select(selectAuthState))),
    mergeMap(([action, authState]) => {
      const logoutAccess = this.authCrud.logoutAccess(authState.accessToken);
      const logoutRefresh = this.authCrud.logoutRefresh(authState.refreshToken);
      return forkJoin([logoutAccess, logoutRefresh]).pipe(
        map(() => AuthActions.logoutSuccess({isAutoLogout: action.isAutoLogout, silent: action.silent})),
        catchError(() => of(AuthActions.logoutError({isAutoLogout: action.isAutoLogout, silent: action.silent})))
      );
    })
  ));

  /**
   * Notifies the user about logout success. If the logout was done automatically (expired refresh token) the user is also notified.
   */
  onLogoutSuccess = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.logoutSuccess),
    map(action => {
      if (!action.silent) {
        if (!action.isAutoLogout) {
          this.store.dispatch(toastNotification(NotificationIdentifier.LOGOUT_SUCCESS));
        } else {
          this.store.dispatch(toastNotification(NotificationIdentifier.AUTO_LOGOUT_SUCCESS));
        }
      }
      return AuthActions.cleanupCredentials({navigateToLogin: !action.silent});
    })
  ));

  /**
   * Tries to perform an auto login using credentials from the local storage and notifies the app if no credentials are found.
   */
  onTryAutoLogin = createEffect(() => this.actions$.pipe(
    ofType(tryAutoLogin),
    tap(() => {
      if (localStorage.getItem('LocalCragAuth') !== null) {
        const autoLoginObject: LoginResponse = JSON.parse(localStorage.getItem('LocalCragAuth') as string);
        this.store.dispatch(newAuthCredentials({
          loginResponse: autoLoginObject,
          fromAutoLogin: true,
          initialCredentials: true
        }));
      } else {
        this.store.dispatch(autoLoginFailed());
      }
    })
  ), {dispatch: false});

  /**
   * Starts two timers:
   *  - A timer that shows an alert when the refresh token is about to expire so the user can log in again
   *  - A timer that performs an auto logout when the refresh token is expired.
   */
  onStartRefreshTokenAboutToExpireTimer = createEffect(() => this.actions$.pipe(
    ofType(startRefreshTokenAboutToExpireTimer),
    withLatestFrom(this.store.pipe(select(selectRefreshTokenExpires), unixToMoment)),
    tap(([_action, refreshTokenExpiresValue]) => {
      const now = moment();
      const warningBeforeExpiry = refreshTokenExpiresValue.clone().subtract(REFRESH_TOKEN_EXPIRY_WARNING_TIME, 'ms');
      let msUntilAlert = warningBeforeExpiry.diff(now);
      if (msUntilAlert < 0) { // Can happen, depending on servers JWT_REFRESH_TOKEN_EXPIRES setting
        msUntilAlert = 0;
      }
      bigIntTimer(msUntilAlert).pipe(
        takeUntil(this.actions$.pipe(ofType(logout))),
        takeUntil(this.actions$.pipe(ofType(login))) // refresh login - not initial login
      ).subscribe(() => {
        this.store.dispatch(showRefreshTokenAboutToExpireAlert());
      });
      bigIntTimer(refreshTokenExpiresValue.diff(now)).pipe(
        takeUntil(this.actions$.pipe(ofType(logout))),
        takeUntil(this.actions$.pipe(ofType(login))) // refresh login - not initial login
      ).subscribe(() => {
        this.store.dispatch(logout({isAutoLogout: true, silent: false}));
      });
    })
  ), {dispatch: false});

  /**
   * Notifies the user about successful logout even though it wasn't successful. The reason is that we can't do anything about this,
   * if the logout fails we throw away the tokens locally and enable the user to login again. From a user's perspective there is no
   * difference to a successful logout.
   */
  onLogoutError = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.logoutError),
    map(action => {
      if (!action.silent) {
        // We notify about a successful logout, although it wasn't successful as we throw away the token locally.
        if (!action.isAutoLogout) {
          this.store.dispatch(toastNotification(NotificationIdentifier.LOGOUT_SUCCESS));
        } else {
          this.store.dispatch(toastNotification(NotificationIdentifier.AUTO_LOGOUT_SUCCESS));
        }
      }
      return AuthActions.cleanupCredentials({navigateToLogin: !action.silent});
    })
  ));

  /**
   * Clears the LocalCrag auth information from the local storage and navigates to the login page.
   */
  onCleanupCredentials = createEffect(() => this.actions$.pipe(
    ofType(AuthActions.cleanupCredentials),
    tap(action => {
      localStorage.removeItem('LocalCragAuth');
      if (action.navigateToLogin) {
        this.router.navigate(['login']);
      }
    })
  ), {dispatch: false});

  constructor(
    private authCrud: AuthCrudService,
    private notifications: AppNotificationsService,
    private actions$: Actions,
    private router: Router,
    private store: Store<AppState>) {
  }

}
