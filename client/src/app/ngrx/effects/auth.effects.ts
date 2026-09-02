import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { AppState } from '../reducers';
import * as AuthActions from '../actions/auth.actions';
import {
  autoLoginFailed,
  newAuthCredentials,
  tryAutoLogin,
} from '../actions/auth.actions';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { AuthCrudService } from '../../services/crud/auth-crud.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { toastNotification } from '../actions/notifications.actions';
import { LoginResponse } from '../../models/login-response';

// noinspection JSUnusedGlobalSymbols
/**
 * Effects that handle auth actions.
 */
@Injectable()
export class AuthEffects {
  private authCrud = inject(AuthCrudService);
  private actions$ = inject(Actions);
  private router = inject(Router);
  private store = inject<Store<AppState>>(Store);

  /**
   * Calls the password forgotten route to send a reset password mail and notifies the app about success or failure.
   */
  onForgotPassword = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.forgotPassword),
      mergeMap((action) =>
        this.authCrud.forgotPassword(action.email).pipe(
          map(() => AuthActions.forgotPasswordSuccess()),
          catchError((err) => {
            if (err === 'USER_NOT_ACTIVATED') {
              this.store.dispatch(toastNotification('USER_NOT_ACTIVATED'));
            }
            return of(AuthActions.forgotPasswordError());
          }),
        ),
      ),
    ),
  );

  /**
   * Notifies the user about a successful password forgotten request.
   */
  onForgotPasswordSuccess = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.forgotPasswordSuccess),
        tap(() => {
          this.router.navigate(['/', 'forgot-password-check-mailbox']);
          this.store.dispatch(toastNotification('FORGOT_PASSWORD_SUCCESS'));
        }),
      ),
    { dispatch: false },
  );

  /**
   * Sends a reset password request to the server and notifies the app about success or failure.
   */
  onResetPassword = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.resetPassword),
      mergeMap((action) =>
        this.authCrud
          .resetPassword(action.password, action.resetPasswordHash)
          .pipe(
            map((response: LoginResponse) => {
              this.store.dispatch(
                newAuthCredentials({
                  loginResponse: response,
                  fromAutoLogin: false,
                  initialCredentials: true,
                }),
              );
              return AuthActions.resetPasswordSuccess();
            }),
            catchError((err) => {
              if (err === 'USER_NOT_ACTIVATED') {
                this.store.dispatch(toastNotification('USER_NOT_ACTIVATED'));
              }
              return of(AuthActions.resetPasswordError());
            }),
          ),
      ),
    ),
  );

  /**
   * Notifies the user about a successful reset password request and navigates the user to the main page.
   */
  onResetPasswordSuccess = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.resetPasswordSuccess),
        tap(() => {
          this.router.navigate(['']);
          this.store.dispatch(toastNotification('RESET_PASSWORD_SUCCESS'));
        }),
      ),
    { dispatch: false },
  );

  /**
   * Sends a login request and notifies the app about success or failure.
   */
  onLogin = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      mergeMap((action) =>
        this.authCrud.login(action.email, action.password).pipe(
          map((loginResponse) => AuthActions.loginSuccess({ loginResponse })),
          catchError(() => of(AuthActions.loginError())),
        ),
      ),
    ),
  );

  /**
   * Notifies the user about unsuccessful login .
   */
  onLoginError = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginError),
        map(() => {
          this.store.dispatch(toastNotification('LOGIN_ERROR'));
        }),
      ),
    { dispatch: false },
  );

  /**
   * Notifies the user about successful login and navigates him to the start page.
   * Also, the new authorization credentials are stored for later use.
   */
  onLoginSuccess = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginSuccess),
      map((action) => {
        this.router.navigate(['']);
        this.store.dispatch(toastNotification('LOGIN_SUCCESS'));
        return newAuthCredentials({
          loginResponse: action.loginResponse,
          fromAutoLogin: false,
          initialCredentials: true,
        });
      }),
    ),
  );

  /**
   * After session credentials are established, navigate away from the login page
   * when restoring a session via /me.
   */
  onNewAuthCredentials = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.newAuthCredentials),
        tap((action) => {
          if (action.fromAutoLogin && this.router.url === '/login') {
            this.router.navigate(['']);
          }
        }),
      ),
    { dispatch: false },
  );

  /**
   * Performs a logout request and notifies the app about success or failure.
   */
  onLogout = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      mergeMap((action) =>
        this.authCrud.logout().pipe(
          map(() =>
            AuthActions.logoutSuccess({
              isAutoLogout: action.isAutoLogout,
              silent: action.silent,
            }),
          ),
          catchError(() =>
            of(
              AuthActions.logoutError({
                isAutoLogout: action.isAutoLogout,
                silent: action.silent,
              }),
            ),
          ),
        ),
      ),
    ),
  );

  /**
   * Notifies the user about logout success. If the logout was done automatically the user is also notified.
   */
  onLogoutSuccess = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutSuccess),
      map((action) => {
        if (!action.silent) {
          if (!action.isAutoLogout) {
            this.store.dispatch(toastNotification('LOGOUT_SUCCESS'));
          } else {
            this.store.dispatch(toastNotification('AUTO_LOGOUT_SUCCESS'));
          }
        }
        return AuthActions.cleanupCredentials({
          navigateToLogin: !action.silent,
        });
      }),
    ),
  );

  /**
   * Tries to restore the session via GET /api/me and notifies the app on failure.
   */
  onTryAutoLogin = createEffect(() =>
    this.actions$.pipe(
      ofType(tryAutoLogin),
      mergeMap(() =>
        this.authCrud.getMe().pipe(
          map((loginResponse) =>
            newAuthCredentials({
              loginResponse,
              fromAutoLogin: true,
              initialCredentials: true,
            }),
          ),
          catchError(() => of(autoLoginFailed())),
        ),
      ),
    ),
  );

  /**
   * Notifies the user about successful logout even though it wasn't successful. The reason is that we can't do anything about this,
   * if the logout fails we clear local session state and enable the user to login again. From a user's perspective there is no
   * difference to a successful logout.
   */
  onLogoutError = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logoutError),
      map((action) => {
        if (!action.silent) {
          // We notify about a successful logout, although it wasn't successful as we clear local session state.
          if (!action.isAutoLogout) {
            this.store.dispatch(toastNotification('LOGOUT_SUCCESS'));
          } else {
            this.store.dispatch(toastNotification('AUTO_LOGOUT_SUCCESS'));
          }
        }
        return AuthActions.cleanupCredentials({
          navigateToLogin: !action.silent,
        });
      }),
    ),
  );

  /**
   * Clears legacy LocalCrag auth information from the local storage and navigates to the login page.
   */
  onCleanupCredentials = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.cleanupCredentials),
        tap((action) => {
          localStorage.removeItem('LocalCragAuth');
          if (action.navigateToLogin) {
            this.router.navigate(['login']);
          }
        }),
      ),
    { dispatch: false },
  );
}
