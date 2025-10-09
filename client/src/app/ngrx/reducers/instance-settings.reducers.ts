import { Action, createReducer, on } from '@ngrx/store';
import { File } from '../../models/file';
import { updateInstanceSettings } from '../actions/instance-settings.actions';
import { FaDefaultFormat } from '../../enums/fa-default-format';
import { StartingPosition } from '../../enums/starting-position';

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
  gymMode: boolean;
  skippedHierarchyLayers: number;
  displayUserGrades: boolean;
  displayUserRatings: boolean;
  faDefaultFormat: FaDefaultFormat;
  defaultStartingPosition: StartingPosition;
  rankingPastWeeks: number | null;
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
  gymMode: false,
  skippedHierarchyLayers: 0,
  displayUserGrades: false,
  displayUserRatings: false,
  faDefaultFormat: FaDefaultFormat.YEAR,
  defaultStartingPosition: StartingPosition.STAND,
  rankingPastWeeks: null,
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
    gymMode: action.settings.gymMode,
    skippedHierarchyLayers: action.settings.skippedHierarchicalLayers,
    displayUserGrades: action.settings.displayUserGrades,
    displayUserRatings: action.settings.displayUserRatings,
    faDefaultFormat: action.settings.faDefaultFormat,
    defaultStartingPosition: action.settings.defaultStartingPosition,
    rankingPastWeeks: action.settings.rankingPastWeeks,
  })),
);

export const reducer = (
  state: InstanceSettingsState | undefined,
  action: Action,
) => instanceSettingsReducer(state, action);
