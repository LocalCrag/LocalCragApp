import { Action, createReducer, on } from '@ngrx/store';
import { File } from '../../models/file';
import { updateInstanceSettings } from '../actions/instance-settings.actions';

export interface InstanceSettingsState {
  instanceName: string;
  copyrightOwner: string;
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
  maxFileSize: number;
  maxImageSize: number;
}

export const initialInstanceSettingsState: InstanceSettingsState = {
  instanceName: 'Loading...',
  copyrightOwner: 'Loading...',
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
  maxFileSize: 0,
  maxImageSize: 0,
};

const instanceSettingsReducer = createReducer(
  initialInstanceSettingsState,
  on(updateInstanceSettings, (state, action) => ({
    ...state,
    instanceName: action.settings.instanceName,
    copyrightOwner: action.settings.copyrightOwner,
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
    maxFileSize: action.settings.maxFileSize,
    maxImageSize: action.settings.maxImageSize,
  })),
);

export const reducer = (
  state: InstanceSettingsState | undefined,
  action: Action,
) => instanceSettingsReducer(state, action);
