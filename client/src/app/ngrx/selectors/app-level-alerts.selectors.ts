import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppLevelAlertsState } from '../reducers/app-level-alerts.reducers';

export const selectAppLevelAlertsState =
  createFeatureSelector<AppLevelAlertsState>('appLevelAlerts');

export const selectShowRefreshTokenAboutToExpireAlert = createSelector(
  selectAppLevelAlertsState,
  (appLevelAlertsState) =>
    appLevelAlertsState.showRefreshTokenAboutToExpireAlert,
);

export const selectShowCookieAlert = createSelector(
  selectAppLevelAlertsState,
  (appLevelAlertsState) => appLevelAlertsState.showCookieAlert,
);
