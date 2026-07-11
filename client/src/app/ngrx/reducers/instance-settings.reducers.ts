import { Action, createReducer, on } from '@ngrx/store';
import { File } from '../../models/file';
import { updateInstanceSettings } from '../actions/instance-settings.actions';
import { FaDefaultFormat } from '../../enums/fa-default-format';
import { StartingPosition } from '../../enums/starting-position';
import { LanguageCode } from '../../utility/types/language';

export interface InstanceSettingsState {
  instanceName: string;
  copyrightOwner: string;
  logoImage: File;
  darkLogoImage: File;
  faviconImage: File;
  mainBgImage: File;
  arrowColor: string;
  arrowTextColor: string;
  arrowHighlightColor: string;
  arrowHighlightTextColor: string;
  barChartColor: string;
  barChartAccentColor: string;
  darkBarChartColor: string;
  darkBarChartAccentColor: string;
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
  language: LanguageCode;
  timezone: string;
}

export const initialInstanceSettingsState: InstanceSettingsState = {
  instanceName: 'Loading...',
  copyrightOwner: 'Loading...',
  logoImage: null,
  darkLogoImage: null,
  faviconImage: null,
  mainBgImage: null,
  arrowColor: null,
  arrowTextColor: null,
  arrowHighlightColor: null,
  arrowHighlightTextColor: null,
  barChartColor: null,
  barChartAccentColor: null,
  darkBarChartColor: null,
  darkBarChartAccentColor: null,
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
  language: null,
  timezone: 'UTC',
};

const instanceSettingsReducer = createReducer(
  initialInstanceSettingsState,
  on(updateInstanceSettings, (state, action) => ({
    ...state,
    instanceName: action.settings.instanceName,
    copyrightOwner: action.settings.copyrightOwner,
    logoImage: action.settings.logoImage,
    darkLogoImage: action.settings.darkLogoImage,
    faviconImage: action.settings.faviconImage,
    mainBgImage: action.settings.mainBgImage,
    arrowColor: action.settings.arrowColor,
    arrowTextColor: action.settings.arrowTextColor,
    arrowHighlightColor: action.settings.arrowHighlightColor,
    arrowHighlightTextColor: action.settings.arrowHighlightTextColor,
    barChartColor: action.settings.barChartColor,
    barChartAccentColor: action.settings.barChartAccentColor,
    darkBarChartColor: action.settings.darkBarChartColor,
    darkBarChartAccentColor: action.settings.darkBarChartAccentColor,
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
    language: action.settings.language,
    timezone: action.settings.timezone,
  })),
);

export const reducer = (
  state: InstanceSettingsState | undefined,
  action: Action,
) => instanceSettingsReducer(state, action);
