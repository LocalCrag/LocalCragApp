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

export const selectLogoImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.logoImage,
);

export const selectDarkLogoImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.darkLogoImage,
);

export const selectFaviconImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.faviconImage,
);

export const selectBarChartColor = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.barChartColor,
);

export const selectBarChartAccentColor = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.barChartAccentColor,
);

export const selectDarkBarChartColor = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.darkBarChartColor,
);

export const selectDarkBarChartAccentColor = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.darkBarChartAccentColor,
);

export const selectRankingPastWeeks = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.rankingPastWeeks,
);

export const selectSkippedHierarchyLayers = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.skippedHierarchyLayers,
);

export const selectInstanceLanguage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.language,
);
