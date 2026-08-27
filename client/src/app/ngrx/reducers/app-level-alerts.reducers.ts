import * as AppLevelAlertsActions from './../actions/app-level-alerts.actions';
import { Action, createReducer, on } from '@ngrx/store';

/**
 * Specifies the state of the app level alerts system.
 * Every available alert type has a boolean value (shown or not shown).
 */
export interface AppLevelAlertsState {
  showCookieAlert: boolean;
  showOfflineAlert: boolean;
}

export const initialAppLevelAlertsState: AppLevelAlertsState = {
  showCookieAlert: false,
  showOfflineAlert: false,
};

const appLevelAlertsStateReducer = createReducer(
  initialAppLevelAlertsState,
  on(AppLevelAlertsActions.showCookieAlert, (state) => ({
    ...state,
    showCookieAlert: true,
  })),
  on(AppLevelAlertsActions.cookiesAccepted, (state) => ({
    ...state,
    showCookieAlert: false,
  })),
  on(AppLevelAlertsActions.showOfflineAlert, (state) =>
    state.showOfflineAlert ? state : { ...state, showOfflineAlert: true },
  ),
  on(AppLevelAlertsActions.hideOfflineAlert, (state) =>
    state.showOfflineAlert ? { ...state, showOfflineAlert: false } : state,
  ),
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
