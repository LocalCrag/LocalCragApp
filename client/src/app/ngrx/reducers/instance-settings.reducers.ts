import {Action, createReducer, on} from '@ngrx/store';
import {File} from '../../models/file';
import {updateInstanceSettings} from '../actions/instance-settings.actions';

export interface InstanceSettingsState {
  instanceName: string;
  copyrightOwner: string;
  youtubeUrl: string;
  instagramUrl: string;
  logoImage: File;
  faviconImage: File;
  mainBgImage: File;
  authBgImage: File;
  arrowColor: string;
  arrowTextColor: string;
  arrowHighlightColor: string;
  arrowHighlightTextColor: string;
  barChartColor: string;
  maptilerApiKey: string;
}

export const initialInstanceSettingsState: InstanceSettingsState = {
  instanceName: 'Loading...',
  copyrightOwner: 'Loading...',
  youtubeUrl: null,
  instagramUrl: null,
  logoImage: null,
  faviconImage: null,
  mainBgImage: null,
  authBgImage: null,
  arrowColor: null,
  arrowTextColor: null,
  arrowHighlightColor: null,
  arrowHighlightTextColor: null,
  barChartColor: null,
  maptilerApiKey: null,
};

const instanceSettingsReducer = createReducer(
  initialInstanceSettingsState,
  on(updateInstanceSettings, (state, action) => ({
    ...state,
    instanceName: action.settings.instanceName,
    copyrightOwner: action.settings.copyrightOwner,
    youtubeUrl: action.settings.youtubeUrl,
    instagramUrl: action.settings.instagramUrl,
    logoImage: action.settings.logoImage,
    faviconImage: action.settings.faviconImage,
    mainBgImage: action.settings.mainBgImage,
    authBgImage: action.settings.authBgImage,
    arrowColor: action.settings.arrowColor,
    arrowTextColor: action.settings.arrowTextColor,
    arrowHighlightColor: action.settings.arrowHighlightColor,
    arrowHighlightTextColor: action.settings.arrowHighlightTextColor,
    barChartColor: action.settings.barChartColor,
    maptilerApiKey: action.settings.maptilerApiKey,
  })),
);

export const reducer = (
  state: InstanceSettingsState | undefined,
  action: Action,
) => instanceSettingsReducer(state, action);
