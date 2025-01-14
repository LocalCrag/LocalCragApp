import { File } from './file';

export class InstanceSettings {
  timeUpdated: Date;
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
  matomoTrackerUrl: string;
  matomoSiteId: string;
  maptilerApiKey: string;
  maxFileSize: number;
  maxImageSize: number;

  public static deserialize(payload: any): InstanceSettings {
    const instanceSettings = new InstanceSettings();
    instanceSettings.timeUpdated = new Date(payload.timeUpdated + 'Z');
    instanceSettings.instanceName = payload.instanceName;
    instanceSettings.copyrightOwner = payload.copyrightOwner;
    instanceSettings.youtubeUrl = payload.youtubeUrl;
    instanceSettings.instagramUrl = payload.instagramUrl;
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
    return instanceSettings;
  }

  public static serialize(instanceSettings: InstanceSettings): any {
    return {
      instanceName: instanceSettings.instanceName,
      copyrightOwner: instanceSettings.copyrightOwner,
      youtubeUrl: instanceSettings.youtubeUrl,
      instagramUrl: instanceSettings.instagramUrl,
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
    };
  }
}
