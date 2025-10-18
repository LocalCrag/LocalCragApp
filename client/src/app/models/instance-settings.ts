import { File } from './file';
import { FaDefaultFormat } from '../enums/fa-default-format';
import { StartingPosition } from '../enums/starting-position';

export class InstanceSettings {
  timeUpdated: Date;
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
  matomoTrackerUrl: string;
  matomoSiteId: string;
  maptilerApiKey: string;
  maxFileSize: number;
  maxImageSize: number;
  gymMode: boolean;
  displayUserGrades: boolean;
  displayUserRatings: boolean;
  skippedHierarchicalLayers: number;
  faDefaultFormat: FaDefaultFormat;
  defaultStartingPosition: StartingPosition;
  rankingPastWeeks: number | null;
  disableFAInAscents: boolean;

  public static deserialize(payload: any): InstanceSettings {
    const instanceSettings = new InstanceSettings();
    instanceSettings.timeUpdated = new Date(payload.timeUpdated + 'Z');
    instanceSettings.instanceName = payload.instanceName;
    instanceSettings.copyrightOwner = payload.copyrightOwner;
    instanceSettings.logoImage = payload.logoImage
      ? File.deserialize(payload.logoImage)
      : null;
    instanceSettings.faviconImage = payload.faviconImage
      ? File.deserialize(payload.faviconImage)
      : null;
    instanceSettings.mainBgImage = payload.mainBgImage
      ? File.deserialize(payload.mainBgImage)
      : null;
    instanceSettings.authBgImage = payload.authBgImage
      ? File.deserialize(payload.authBgImage)
      : null;
    instanceSettings.arrowColor = payload.arrowColor;
    instanceSettings.arrowTextColor = payload.arrowTextColor;
    instanceSettings.arrowHighlightColor = payload.arrowHighlightColor;
    instanceSettings.arrowHighlightTextColor = payload.arrowHighlightTextColor;
    instanceSettings.barChartColor = payload.barChartColor;
    instanceSettings.matomoTrackerUrl = payload.matomoTrackerUrl;
    instanceSettings.matomoSiteId = payload.matomoSiteId;
    instanceSettings.maptilerApiKey = payload.maptilerApiKey;
    instanceSettings.maxFileSize = payload.maxFileSize;
    instanceSettings.maxImageSize = payload.maxImageSize;
    instanceSettings.gymMode = payload.gymMode;
    instanceSettings.displayUserGrades = payload.displayUserGrades;
    instanceSettings.displayUserRatings = payload.displayUserRatings;
    instanceSettings.skippedHierarchicalLayers =
      payload.skippedHierarchicalLayers;
    instanceSettings.faDefaultFormat = payload.faDefaultFormat;
    instanceSettings.defaultStartingPosition = payload.defaultStartingPosition;
    instanceSettings.rankingPastWeeks = payload.rankingPastWeeks;
    instanceSettings.disableFAInAscents = payload.disableFAInAscents;
    return instanceSettings;
  }

  public static serialize(instanceSettings: InstanceSettings): any {
    return {
      instanceName: instanceSettings.instanceName,
      copyrightOwner: instanceSettings.copyrightOwner,
      logoImage: instanceSettings.logoImage
        ? instanceSettings.logoImage.id
        : null,
      faviconImage: instanceSettings.faviconImage
        ? instanceSettings.faviconImage.id
        : null,
      mainBgImage: instanceSettings.mainBgImage
        ? instanceSettings.mainBgImage.id
        : null,
      authBgImage: instanceSettings.authBgImage
        ? instanceSettings.authBgImage.id
        : null,
      arrowColor: instanceSettings.arrowColor,
      arrowTextColor: instanceSettings.arrowTextColor,
      arrowHighlightColor: instanceSettings.arrowHighlightColor,
      arrowHighlightTextColor: instanceSettings.arrowHighlightTextColor,
      barChartColor: instanceSettings.barChartColor,
      matomoTrackerUrl: instanceSettings.matomoTrackerUrl,
      matomoSiteId: instanceSettings.matomoSiteId,
      maptilerApiKey: instanceSettings.maptilerApiKey,
      gymMode: instanceSettings.gymMode,
      displayUserGrades: instanceSettings.displayUserGrades,
      displayUserRatings: instanceSettings.displayUserRatings,
      skippedHierarchicalLayers: instanceSettings.skippedHierarchicalLayers,
      faDefaultFormat: instanceSettings.faDefaultFormat,
      defaultStartingPosition: instanceSettings.defaultStartingPosition,
      rankingPastWeeks: instanceSettings.rankingPastWeeks,
      disableFAInAscents: instanceSettings.disableFAInAscents,
    };
  }
}
