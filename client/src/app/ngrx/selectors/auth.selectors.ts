// noinspection JSUnusedGlobalSymbols

import {createFeatureSelector, createSelector} from '@ngrx/store';
import {AuthState} from '../reducers/auth.reducers';

export const selectAuthState = createFeatureSelector<AuthState>('auth');

export const selectForgotPasswordLoadingState = createSelector(
  selectAuthState,
  authState => authState.forgotPasswordLoadingState
);

export const selectResetPasswordLoadingState = createSelector(
  selectAuthState,
  authState => authState.resetPasswordLoadingState
);

export const selectRegisterLoadingState = createSelector(
  selectAuthState,
  authState => authState.registerLoadingState
);

export const selectLoginLoadingState = createSelector(
  selectAuthState,
  authState => authState.loginLoadingState
);

export const selectIsLoggedIn = createSelector(
  selectAuthState,
  authState => authState.isLoggedIn
);

export const selectIsAdmin = createSelector(
  selectAuthState,
  authState => authState.user?.admin || false
);

export const selectIsModerator = createSelector(
  selectAuthState,
  authState => authState.user?.moderator || false
);

export const selectIsMember = createSelector(
  selectAuthState,
  authState => authState.user?.member || false
);

export const selectIsLoggedOut = createSelector(
  selectAuthState,
  authState => !authState.isLoggedIn
);

export const selectAccessTokenExpires = createSelector(
  selectAuthState,
  authState => authState.accessTokenExpires
);

export const selectRefreshTokenExpires = createSelector(
  selectAuthState,
  authState => authState.refreshTokenExpires
);

export const selectAccessToken = createSelector(
  selectAuthState,
  authState => authState.accessToken
);

export const selectCurrentUser = createSelector(
  selectAuthState,
  authState => authState.user
);

export const selectRefreshLoginModalOpen = createSelector(
  selectAuthState,
  authState => authState.refreshLoginModalOpen
);

export const selectRefreshLoginLoadingState = createSelector(
  selectAuthState,
  authState => authState.refreshLoginLoadingState
);

export const selectRefreshLoginModalLogoutLoadingState = createSelector(
  selectAuthState,
  authState => authState.refreshLoginModalLogoutLoadingState
);

