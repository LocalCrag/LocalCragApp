// noinspection JSUnusedGlobalSymbols

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InstanceSettingsState } from '../reducers/instance-settings.reducers';

export const selectInstanceSettingsState =
  createFeatureSelector<InstanceSettingsState>('instanceSettings');

export const selectCopyrightOwner = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.copyrightOwner,
);

export const selectInstanceName = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.instanceName,
);

export const selectGymMode = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.gymMode,
);

export const selectMainBgImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.mainBgImage,
);

export const selectAuthBgImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.authBgImage,
);

export const selectLogoImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.logoImage,
);

export const selectFaviconImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.faviconImage,
);

export const selectBarChartColor = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.barChartColor,
);
