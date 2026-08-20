import { File } from './file';
import { FaDefaultFormat } from '../enums/fa-default-format';
import { StartingPosition } from '../enums/starting-position';
import { LanguageCode } from '../utility/types/language';
import { parseServerUtcDate } from '../utility/parse-server-utc-date';
import { MapBaseLayer } from './map-base-layer';
import { MapOverlay } from './map-overlay';

export type InstanceSettingsPatch = Record<string, unknown>;

export class InstanceSettings {
  timeUpdated: Date;
  instanceName: string;
  copyrightOwner: string;
  mailGreeting: string;
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
  matomoTrackerUrl: string;
  matomoSiteId: string;
  mapBaseLayers: MapBaseLayer[];
  mapOverlays: MapOverlay[];
  maxFileSize: number;
  maxImageSize: number;
  sentryEnabled: boolean;
  sentryDsn: string;
  gymMode: boolean;
  displayUserGrades: boolean;
  displayUserRatings: boolean;
  skippedHierarchicalLayers: number;
  faDefaultFormat: FaDefaultFormat;
  defaultStartingPosition: StartingPosition;
  rankingPastWeeks: number | null;
  language: LanguageCode;
  timezone: string;

  public static deserialize(payload: any): InstanceSettings {
    const instanceSettings = new InstanceSettings();
    instanceSettings.timeUpdated = parseServerUtcDate(payload.timeUpdated);
    instanceSettings.instanceName = payload.instanceName;
    instanceSettings.copyrightOwner = payload.copyrightOwner;
    instanceSettings.mailGreeting = payload.mailGreeting;
    instanceSettings.logoImage = payload.logoImage
      ? File.deserialize(payload.logoImage)
      : null;
    instanceSettings.darkLogoImage = payload.darkLogoImage
      ? File.deserialize(payload.darkLogoImage)
      : null;
    instanceSettings.faviconImage = payload.faviconImage
      ? File.deserialize(payload.faviconImage)
      : null;
    instanceSettings.bgImage = payload.bgImage
      ? File.deserialize(payload.bgImage)
      : null;
    instanceSettings.arrowColor = payload.arrowColor;
    instanceSettings.arrowTextColor = payload.arrowTextColor;
    instanceSettings.arrowHighlightColor = payload.arrowHighlightColor;
    instanceSettings.arrowHighlightTextColor = payload.arrowHighlightTextColor;
    instanceSettings.barChartColor = payload.barChartColor;
    instanceSettings.barChartAccentColor = payload.barChartAccentColor;
    instanceSettings.darkBarChartColor = payload.darkBarChartColor;
    instanceSettings.darkBarChartAccentColor = payload.darkBarChartAccentColor;
    instanceSettings.matomoTrackerUrl = payload.matomoTrackerUrl;
    instanceSettings.matomoSiteId = payload.matomoSiteId;
    instanceSettings.mapBaseLayers = (payload.mapBaseLayers ?? [])
      .map(MapBaseLayer.deserialize)
      .filter((layer: MapBaseLayer) => layer.id.length > 0);
    instanceSettings.mapOverlays = (payload.mapOverlays ?? [])
      .map(MapOverlay.deserialize)
      .filter((layer: MapOverlay) => layer.id.length > 0);
    instanceSettings.maxFileSize = payload.maxFileSize;
    instanceSettings.maxImageSize = payload.maxImageSize;
    instanceSettings.sentryEnabled = payload.sentryEnabled;
    instanceSettings.sentryDsn = payload.sentryDsn;
    instanceSettings.gymMode = payload.gymMode;
    instanceSettings.displayUserGrades = payload.displayUserGrades;
    instanceSettings.displayUserRatings = payload.displayUserRatings;
    instanceSettings.skippedHierarchicalLayers =
      payload.skippedHierarchicalLayers;
    instanceSettings.faDefaultFormat = payload.faDefaultFormat;
    instanceSettings.defaultStartingPosition = payload.defaultStartingPosition;
    instanceSettings.rankingPastWeeks = payload.rankingPastWeeks;
    instanceSettings.language = payload.language;
    instanceSettings.timezone = payload.timezone ?? 'UTC';
    return instanceSettings;
  }

  public static serialize(instanceSettings: InstanceSettings): any {
    return {
      instanceName: instanceSettings.instanceName,
      copyrightOwner: instanceSettings.copyrightOwner,
      mailGreeting: instanceSettings.mailGreeting,
      logoImage: instanceSettings.logoImage
        ? instanceSettings.logoImage.id
        : null,
      darkLogoImage: instanceSettings.darkLogoImage
        ? instanceSettings.darkLogoImage.id
        : null,
      faviconImage: instanceSettings.faviconImage
        ? instanceSettings.faviconImage.id
        : null,
      bgImage: instanceSettings.bgImage ? instanceSettings.bgImage.id : null,
      arrowColor: instanceSettings.arrowColor,
      arrowTextColor: instanceSettings.arrowTextColor,
      arrowHighlightColor: instanceSettings.arrowHighlightColor,
      arrowHighlightTextColor: instanceSettings.arrowHighlightTextColor,
      barChartColor: instanceSettings.barChartColor,
      barChartAccentColor: instanceSettings.barChartAccentColor,
      darkBarChartColor: instanceSettings.darkBarChartColor,
      darkBarChartAccentColor: instanceSettings.darkBarChartAccentColor,
      matomoTrackerUrl: instanceSettings.matomoTrackerUrl,
      matomoSiteId: instanceSettings.matomoSiteId,
      mapBaseLayers: (instanceSettings.mapBaseLayers ?? []).map(
        MapBaseLayer.serialize,
      ),
      mapOverlays: (instanceSettings.mapOverlays ?? []).map(
        MapOverlay.serialize,
      ),
      gymMode: instanceSettings.gymMode,
      displayUserGrades: instanceSettings.displayUserGrades,
      displayUserRatings: instanceSettings.displayUserRatings,
      skippedHierarchicalLayers: instanceSettings.skippedHierarchicalLayers,
      faDefaultFormat: instanceSettings.faDefaultFormat,
      defaultStartingPosition: instanceSettings.defaultStartingPosition,
      rankingPastWeeks: instanceSettings.rankingPastWeeks,
      language: instanceSettings.language,
      timezone: instanceSettings.timezone,
    };
  }

  public static serializeGeneralPatch(payload: {
    instanceName: string;
    copyrightOwner: string;
    mailGreeting: string;
    gymMode: boolean;
    skippedHierarchicalLayers: number;
    displayUserGrades: boolean;
    displayUserRatings: boolean;
    faDefaultFormat: FaDefaultFormat;
    defaultStartingPosition: StartingPosition;
    rankingPastWeeks: number | null;
    language: LanguageCode;
    timezone: string;
  }): InstanceSettingsPatch {
    return { ...payload };
  }

  public static serializeAppearancePatch(payload: {
    logoImage: File | null;
    darkLogoImage: File | null;
    faviconImage: File | null;
    bgImage: File | null;
    arrowColor: string;
    arrowTextColor: string;
    arrowHighlightColor: string;
    arrowHighlightTextColor: string;
    barChartColor: string;
    barChartAccentColor: string;
    darkBarChartColor: string;
    darkBarChartAccentColor: string;
  }): InstanceSettingsPatch {
    return {
      logoImage: payload.logoImage ? payload.logoImage.id : null,
      darkLogoImage: payload.darkLogoImage ? payload.darkLogoImage.id : null,
      faviconImage: payload.faviconImage ? payload.faviconImage.id : null,
      bgImage: payload.bgImage ? payload.bgImage.id : null,
      arrowColor: payload.arrowColor,
      arrowTextColor: payload.arrowTextColor,
      arrowHighlightColor: payload.arrowHighlightColor,
      arrowHighlightTextColor: payload.arrowHighlightTextColor,
      barChartColor: payload.barChartColor,
      barChartAccentColor: payload.barChartAccentColor,
      darkBarChartColor: payload.darkBarChartColor,
      darkBarChartAccentColor: payload.darkBarChartAccentColor,
    };
  }

  public static serializeAnalyticsPatch(payload: {
    matomoTrackerUrl: string | null;
    matomoSiteId: string | null;
  }): InstanceSettingsPatch {
    return { ...payload };
  }

  public static serializeMapsPatch(payload: {
    mapBaseLayers: MapBaseLayer[];
    mapOverlays: MapOverlay[];
  }): InstanceSettingsPatch {
    return {
      mapBaseLayers: (payload.mapBaseLayers ?? []).map(MapBaseLayer.serialize),
      mapOverlays: (payload.mapOverlays ?? []).map(MapOverlay.serialize),
    };
  }
}
