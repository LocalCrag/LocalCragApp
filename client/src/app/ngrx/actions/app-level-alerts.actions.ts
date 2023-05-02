import {createAction} from '@ngrx/store';

export const showRefreshTokenAboutToExpireAlert = createAction(
  '[Alerts] Show refresh token about to expire alert'
);

export const checkShowCookieAlert = createAction(
  '[Alerts] Check show cookie alert'
);

export const showCookieAlert = createAction(
  '[Alerts] Show cookie alert'
);

export const cookiesAccepted = createAction(
  '[Alerts] Cookies accepted: Hide cookie alert'
);
