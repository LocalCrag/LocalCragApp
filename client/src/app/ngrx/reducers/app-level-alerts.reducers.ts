import * as AppLevelAlertsActions from './../actions/app-level-alerts.actions';
import * as AuthActions from './../actions/auth.actions';
import {Action, createReducer, on} from '@ngrx/store';

/**
 * Specifies the state of the app level alerts system.
 * Every available alert type has a boolean value (shown or not shown).
 */
export interface AppLevelAlertsState {
  showRefreshTokenAboutToExpireAlert: boolean;
  showCookieAlert: boolean;
}

export const initialAppLevelAlertsState: AppLevelAlertsState = {
  showRefreshTokenAboutToExpireAlert: false,
  showCookieAlert: false,
};

const appLevelAlertsStateReducer = createReducer(
  initialAppLevelAlertsState,
  on(AppLevelAlertsActions.showRefreshTokenAboutToExpireAlert, (state) => ({
    ...state,
    showRefreshTokenAboutToExpireAlert: true,
  })),
  on(AuthActions.cleanupCredentials, (state) => ({
    ...state,
    showRefreshTokenAboutToExpireAlert: false,
  })),
  on(AppLevelAlertsActions.showCookieAlert, (state) => ({
    ...state,
    showCookieAlert: true,
  })),
  on(AppLevelAlertsActions.cookiesAccepted, (state) => ({
    ...state,
    showCookieAlert: false,
  })),
  on(AuthActions.openRefreshLoginModal, (state) => ({
    ...state,
    showRefreshTokenAboutToExpireAlert: false,
  })),
);

/**
 * Reducer for the app level alert state.
 *
 * @param state Input state.
 * @param action Input action.
 */
export const reducer = (
  state: AppLevelAlertsState | undefined,
  action: Action,
) => appLevelAlertsStateReducer(state, action);
