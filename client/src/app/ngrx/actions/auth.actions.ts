import { createAction, props } from '@ngrx/store';
import { LoginResponse } from '../../models/login-response';
import { User } from '../../models/user';

export const forgotPassword = createAction(
  '[Forgot Password Page] Forgot password',
  props<{ email: string }>(),
);

export const forgotPasswordSuccess = createAction(
  '[Forgot Password Page] Forgot password success',
);

export const forgotPasswordError = createAction(
  '[Forgot Password Page] Forgot password error',
);

export const updateAccountSettings = createAction(
  '[Account Settings] Update settings',
  props<{ user: User }>(),
);

export const resetPassword = createAction(
  '[Reset Password Page] Reset password',
  props<{ resetPasswordHash: string; password: string }>(),
);

export const resetPasswordSuccess = createAction(
  '[Reset Password Page] Reset password success',
);

export const resetPasswordError = createAction(
  '[Reset Password Page] Reset password error',
);

export const login = createAction(
  '[Login Page] Login',
  props<{ email: string; password: string }>(),
);

export const loginSuccess = createAction(
  '[Login Page] Login success',
  props<{ loginResponse: LoginResponse }>(),
);

export const loginError = createAction('[Login Page] Login error');

export const newAuthCredentials = createAction(
  '[Auth] New auth credentials',
  props<{
    loginResponse: LoginResponse;
    fromAutoLogin: boolean;
    initialCredentials: boolean;
  }>(),
);

export const startAccessTokenRefreshTimer = createAction(
  '[Auth] Start access token refresh timer',
);

export const startRefreshTokenAboutToExpireTimer = createAction(
  '[Auth] Start refresh token about to expire timer',
);

export const refreshAccessToken = createAction('[Auth] Refresh access token');

export const autoLoginFailed = createAction('[Auth] Auto login failed');

export const refreshAccessTokenFailed = createAction(
  '[Auth] Refresh access token failed',
);

export const tryAutoLogin = createAction('[Auth] Try auto login');

export const logout = createAction(
  '[Header] Logout',
  props<{ isAutoLogout: boolean; silent: boolean }>(),
);

export const logoutSuccess = createAction(
  '[Header] Logout success',
  props<{ isAutoLogout: boolean; silent: boolean }>(),
);

export const logoutError = createAction(
  '[Auth] Logout error',
  props<{ isAutoLogout: boolean; silent: boolean }>(),
);

export const cleanupCredentials = createAction(
  '[Auth] Cleanup credentials',
  props<{ navigateToLogin: boolean }>(),
);

export const openRefreshLoginModal = createAction(
  '[Auth] Open refresh login modal',
);
