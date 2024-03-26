// noinspection JSUnusedGlobalSymbols

import {createFeatureSelector, createSelector} from '@ngrx/store';
import {AuthState} from '../reducers/auth.reducers';
import {InstanceSettingsState} from '../reducers/instance-settings.reducers';

export const selectInstanceSettingsState = createFeatureSelector<InstanceSettingsState>('instanceSettings');

export const selectCopyrightOwner = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.copyrightOwner
);

export const selectInstanceName = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.instanceName
);

export const selectYoutubeUrl = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.youtubeUrl
);

export const selectInstagramUrl = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.instagramUrl
);

export const selectMainBgImage = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.mainBgImage
);

export const selectAuthBgImage = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.authBgImage
);

export const selectLogoImage = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.logoImage
);

export const selectFaviconImage = createSelector(
  selectInstanceSettingsState,
  instanceSettingsState => instanceSettingsState.faviconImage
);



