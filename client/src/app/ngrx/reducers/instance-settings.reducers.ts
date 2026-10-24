import { Action, createReducer, on } from '@ngrx/store';
import { File } from '../../models/file';
import { updateInstanceSettings } from '../actions/instance-settings.actions';
import { FaDefaultFormat } from '../../enums/fa-default-format';
import { LandingPage } from '../../enums/landing-page';
import { StartingPosition } from '../../enums/starting-position';
import { LanguageCode } from '../../utility/types/language';
import { MapBaseLayer } from '../../models/map-base-layer';
import { MapOverlay } from '../../models/map-overlay';

export interface InstanceSettingsState {
  instanceName: string;
  copyrightOwner: string;
  logoImage: File;
  darkLogoImage: File;
  faviconImage: File;
  bgImage: File;
  arrowColor: string;
  arrowTextColor: string;
  arrowHighlightColor: string;
  arrowHighlightTextColor: string;
  barChartColor: string;
  barChartAccentColor: string;
  darkBarChartColor: string;
  darkBarChartAccentColor: string;
  mapBaseLayers: MapBaseLayer[];
  mapOverlays: MapOverlay[];
  maxFileSize: number;
  maxImageSize: number;
  sentryEnabled: boolean;
  sentryDsn: string;
  gymMode: boolean;
  landingPage: LandingPage;
  landingPageSlug: string | null;
  skippedHierarchyLayers: number;
  displayUserGrades: boolean;
  displayUserRatings: boolean;
  noClosedProjects: boolean;
  suggestionsEnabled: boolean;
  faDefaultFormat: FaDefaultFormat;
  defaultStartingPosition: StartingPosition;
  rankingPastWeeks: number | null;
  language: LanguageCode;
  timezone: string;
  loaded: boolean;
}

export const initialInstanceSettingsState: InstanceSettingsState = {
  instanceName: 'Loading...',
  copyrightOwner: 'Loading...',
  logoImage: null,
  darkLogoImage: null,
  faviconImage: null,
  bgImage: null,
  arrowColor: null,
  arrowTextColor: null,
  arrowHighlightColor: null,
  arrowHighlightTextColor: null,
  barChartColor: null,
  barChartAccentColor: null,
  darkBarChartColor: null,
  darkBarChartAccentColor: null,
  mapBaseLayers: [],
  mapOverlays: [],
  maxFileSize: 0,
  maxImageSize: 0,
  sentryEnabled: false,
  sentryDsn: '',
  gymMode: false,
  landingPage: LandingPage.NEWS,
  landingPageSlug: null,
  skippedHierarchyLayers: 0,
  displayUserGrades: false,
  displayUserRatings: false,
  noClosedProjects: false,
  suggestionsEnabled: true,
  faDefaultFormat: FaDefaultFormat.YEAR,
  defaultStartingPosition: StartingPosition.STAND,
  rankingPastWeeks: null,
  language: null,
  timezone: 'UTC',
  loaded: false,
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
    bgImage: action.settings.bgImage,
    arrowColor: action.settings.arrowColor,
    arrowTextColor: action.settings.arrowTextColor,
    arrowHighlightColor: action.settings.arrowHighlightColor,
    arrowHighlightTextColor: action.settings.arrowHighlightTextColor,
    barChartColor: action.settings.barChartColor,
    barChartAccentColor: action.settings.barChartAccentColor,
    darkBarChartColor: action.settings.darkBarChartColor,
    darkBarChartAccentColor: action.settings.darkBarChartAccentColor,
    mapBaseLayers: action.settings.mapBaseLayers ?? [],
    mapOverlays: action.settings.mapOverlays ?? [],
    maxFileSize: action.settings.maxFileSize,
    maxImageSize: action.settings.maxImageSize,
    sentryEnabled: action.settings.sentryEnabled,
    sentryDsn: action.settings.sentryDsn,
    gymMode: action.settings.gymMode,
    landingPage: action.settings.landingPage ?? LandingPage.NEWS,
    landingPageSlug: action.settings.landingPageSlug ?? null,
    skippedHierarchyLayers: action.settings.skippedHierarchicalLayers,
    displayUserGrades: action.settings.displayUserGrades,
    displayUserRatings: action.settings.displayUserRatings,
    noClosedProjects: action.settings.noClosedProjects,
    suggestionsEnabled: action.settings.suggestionsEnabled,
    faDefaultFormat: action.settings.faDefaultFormat,
    defaultStartingPosition: action.settings.defaultStartingPosition,
    rankingPastWeeks: action.settings.rankingPastWeeks,
    language: action.settings.language,
    timezone: action.settings.timezone,
    loaded: true,
  })),
);

export const reducer = (
  state: InstanceSettingsState | undefined,
  action: Action,
) => instanceSettingsReducer(state, action);
