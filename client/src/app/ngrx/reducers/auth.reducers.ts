import * as AuthActions from './../actions/auth.actions';
import { Action, createReducer, on } from '@ngrx/store';
import { User } from '../../models/user';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { LoadingState } from '../../enums/loading-state';

/**
 * The state of the apps auth properties.
 */
export interface AuthState {
  isLoggedIn: boolean;
  refreshToken: string;
  accessToken: string;
  loginLoadingState: LoadingState;
  registerLoadingState: LoadingState;
  resetPasswordLoadingState: LoadingState;
  forgotPasswordLoadingState: LoadingState;
  accessTokenExpires: number;
  refreshTokenExpires: number;
  user: User;
  refreshLoginModalOpen: boolean;
  refreshLoginLoadingState: LoadingState;
  refreshLoginModalLogoutLoadingState: LoadingState;
}

export const initialAuthState: AuthState = {
  isLoggedIn: false,
  loginLoadingState: LoadingState.DEFAULT,
  registerLoadingState: LoadingState.DEFAULT,
  resetPasswordLoadingState: LoadingState.DEFAULT,
  forgotPasswordLoadingState: LoadingState.DEFAULT,
  accessToken: null,
  refreshToken: null,
  accessTokenExpires: null,
  refreshTokenExpires: null,
  user: null,
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
    isLoggedIn: false,
    refreshToken: null,
    accessToken: null,
    accessTokenExpires: null,
    refreshTokenExpires: null,
    user: null,
  })),
  on(AuthActions.loginError, (state) => ({
    ...state,
    loginLoadingState: LoadingState.DEFAULT,
    refreshLoginLoadingState: LoadingState.DEFAULT,
  })),
  on(AuthActions.newAuthCredentials, (state, action) => {
    const refreshToken =
      action.loginResponse.refreshToken !== null
        ? action.loginResponse.refreshToken
        : state.refreshToken;
    const accessToken =
      action.loginResponse.accessToken !== null
        ? action.loginResponse.accessToken
        : state.accessToken;
    return {
      ...state,
      isLoggedIn: true,
      user: action.loginResponse.user,
      accessToken,
      refreshToken,
      refreshTokenExpires: jwtDecode<JwtPayload>(refreshToken).exp,
      accessTokenExpires: jwtDecode<JwtPayload>(accessToken).exp,
    };
  }),
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
