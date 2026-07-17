import { createAction } from '@ngrx/store';

export const showRefreshTokenAboutToExpireAlert = createAction(
  '[Alerts] Show refresh token about to expire alert',
);

export const checkShowCookieAlert = createAction(
  '[Alerts] Check show cookie alert',
);

export const showCookieAlert = createAction('[Alerts] Show cookie alert');

export const cookiesAccepted = createAction(
  '[Alerts] Cookies accepted: Hide cookie alert',
);

/** Show offline banner after a failed request/chunk load (not from window.offline alone). */
export const showOfflineAlert = createAction('[Alerts] Show offline alert');

/** Hide offline banner (window.online heuristic or successful HTTP). */
export const hideOfflineAlert = createAction('[Alerts] Hide offline alert');
