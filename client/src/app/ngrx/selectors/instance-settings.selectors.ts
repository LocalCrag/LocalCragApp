// noinspection JSUnusedGlobalSymbols

import { createFeatureSelector, createSelector } from '@ngrx/store';
import { InstanceSettingsState } from '../reducers/instance-settings.reducers';
import { selectCurrentUser, selectIsModerator } from './auth.selectors';

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

export const selectNoClosedProjects = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.noClosedProjects,
);

export const selectCanSuggest = createSelector(
  selectCurrentUser,
  selectInstanceSettingsState,
  (user, settings) =>
    !!settings.loaded &&
    !!user &&
    !user.moderator &&
    settings.suggestionsEnabled &&
    user.suggestionsEnabled,
);

export const selectCanContributeTopo = createSelector(
  selectIsModerator,
  selectCanSuggest,
  (isModerator, canSuggest) => isModerator || canSuggest,
);

export const selectBgImage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.bgImage,
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

export const selectModeratorGameEnabled = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.moderatorGameEnabled,
);

export const selectInstanceLanguage = createSelector(
  selectInstanceSettingsState,
  (instanceSettingsState) => instanceSettingsState.language,
);
