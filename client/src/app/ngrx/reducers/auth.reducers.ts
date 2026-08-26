import * as AuthActions from './../actions/auth.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { User } from '../../models/user';
import { LoadingState } from '../../enums/loading-state';

/**
 * The state of the apps auth properties.
 */
export interface AuthState {
  loginLoadingState: LoadingState;
  registerLoadingState: LoadingState;
  resetPasswordLoadingState: LoadingState;
  forgotPasswordLoadingState: LoadingState;
  user: User;
  /** False until session restore via /me finishes (or fails). Guards must wait. */
  authResolved: boolean;
  refreshLoginModalOpen: boolean;
  refreshLoginLoadingState: LoadingState;
  refreshLoginModalLogoutLoadingState: LoadingState;
}

export const initialAuthState: AuthState = {
  loginLoadingState: LoadingState.DEFAULT,
  registerLoadingState: LoadingState.DEFAULT,
  resetPasswordLoadingState: LoadingState.DEFAULT,
  forgotPasswordLoadingState: LoadingState.DEFAULT,
  user: null,
  authResolved: false,
  refreshLoginLoadingState: LoadingState.DEFAULT,
  refreshLoginModalOpen: false,
  refreshLoginModalLogoutLoadingState: LoadingState.DEFAULT,
};

const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.login, (state) => ({
    ...state,
    loginLoadingState: LoadingState.LOADING,
    refreshLoginLoadingState: LoadingState.LOADING,
  })),
  on(AuthActions.loginSuccess, (state) => ({
    ...state,
    loginLoadingState: LoadingState.DEFAULT,
    refreshLoginLoadingState: LoadingState.DEFAULT,
    refreshLoginModalOpen: false,
  })),
  on(AuthActions.cleanupCredentials, (state) => ({
    ...state,
    user: null,
  })),
  on(AuthActions.loginError, (state) => ({
    ...state,
    loginLoadingState: LoadingState.DEFAULT,
    refreshLoginLoadingState: LoadingState.DEFAULT,
  })),
  on(AuthActions.newAuthCredentials, (state, action) => ({
    ...state,
    user: action.loginResponse.user,
    authResolved: true,
  })),
  on(AuthActions.autoLoginFailed, (state) => ({
    ...state,
    authResolved: true,
  })),
  on(AuthActions.updateAccountSettings, (state, action) => ({
    ...state,
    user: action.user,
  })),
  on(AuthActions.resetPassword, (state) => ({
    ...state,
    resetPasswordLoadingState: LoadingState.LOADING,
  })),
  on(AuthActions.resetPasswordError, (state) => ({
    ...state,
    resetPasswordLoadingState: LoadingState.DEFAULT,
  })),
  on(AuthActions.resetPasswordSuccess, (state) => ({
    ...state,
    resetPasswordLoadingState: LoadingState.DEFAULT,
  })),
  on(AuthActions.forgotPassword, (state) => ({
    ...state,
    forgotPasswordLoadingState: LoadingState.LOADING,
  })),
  on(AuthActions.forgotPasswordError, (state) => ({
    ...state,
    forgotPasswordLoadingState: LoadingState.DEFAULT,
  })),
  on(AuthActions.forgotPasswordSuccess, (state) => ({
    ...state,
    forgotPasswordLoadingState: LoadingState.DEFAULT,
  })),
  on(AuthActions.openRefreshLoginModal, (state) => ({
    ...state,
    refreshLoginLoadingState: LoadingState.DEFAULT,
    refreshLoginModalOpen: true,
  })),
  on(AuthActions.logoutSuccess, (state) => ({
    ...state,
    refreshLoginLoadingState: LoadingState.DEFAULT,
    refreshLoginModalOpen: false,
  })),
);

/**
 * Reducer for auth actions.
 *
 * @param state Input state.
 * @param action Input action.
 */
export const reducer = (state: AuthState | undefined, action: Action) =>
  authReducer(state, action);
