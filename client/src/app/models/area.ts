import { AbstractModel } from './abstract-model';
import { File } from './file';
import { Sector } from './sector';
import { MapMarker } from './map-marker';
import {
  deserializeClosableAttributes,
  IsClosable,
  serializeClosableAttributes,
} from './mixins/is-closable';
import {
  deserializeOrderIndexAttributes,
  HasOrderIndex,
} from './mixins/has-order-index';
import { deserializeSlugAttributes, HasSlug } from './mixins/has-slug';
import { topoAreaRouterLink } from './topo-router-link';

/**
 * Model of a climbing sector's area.
 */
export class Area extends IsClosable(HasOrderIndex(HasSlug(AbstractModel))) {
  name: string;
  description: string;
  shortDescription: string;
  portraitImage: File;
  lineCount: number;
  ascentCount: number;
  imageCount: number;
  commentCount: number;
  topoImageCount: number;
  taskCount?: number;
  secret: boolean;
  mapMarkers: MapMarker[];
  defaultBoulderScale: string | null = null;
  defaultSportScale: string | null = null;
  defaultTradScale: string | null = null;
  blocweatherUrl: string | null = null;

  sector: Sector | null;
  routerLink: string | null;

  /**
   * Parses an area.
   *
   * @param payload Area json payload.
   * @return Parsed Area.
   */
  public static deserialize(payload: any): Area {
    const area = new Area();
    AbstractModel.deserializeAbstractAttributes(area, payload);
    deserializeClosableAttributes(area, payload);
    deserializeSlugAttributes(area, payload);
    deserializeOrderIndexAttributes(area, payload);
    area.name = payload.name;
    area.description = payload.description;
    area.shortDescription = payload.shortDescription;
    area.portraitImage = payload.portraitImage
      ? File.deserialize(payload.portraitImage)
      : null;
    area.sector = payload.sector ? Sector.deserialize(payload.sector) : null;
    area.lineCount = payload.lineCount;
    area.ascentCount = payload.ascentCount;
    area.imageCount = payload.imageCount;
    area.commentCount = payload.commentCount;
    area.topoImageCount = payload.topoImageCount;
    area.taskCount = payload.taskCount;
    area.secret = payload.secret;
    area.mapMarkers = payload.mapMarkers
      ? payload.mapMarkers.map(MapMarker.deserialize)
      : null;
    area.routerLink = topoAreaRouterLink(area);
    area.defaultBoulderScale = payload.defaultBoulderScale;
    area.defaultSportScale = payload.defaultSportScale;
    area.defaultTradScale = payload.defaultTradScale;
    area.blocweatherUrl = payload.blocweatherUrl ?? null;
    return area;
  }

  /**
   * Marshals an area.
   *
   * @param area Area to marshall.
   * @return Marshalled Area.
   */
  public static serialize(area: Area): any {
    return {
      ...serializeClosableAttributes(area),
      ...{
        name: area.name,
        description: area.description,
        shortDescription: area.shortDescription,
        secret: area.secret,
        portraitImage: area.portraitImage ? area.portraitImage.id : null,
        mapMarkers: area.mapMarkers
          ? area.mapMarkers.map(MapMarker.serialize)
          : null,
        defaultBoulderScale: area.defaultBoulderScale,
        defaultSportScale: area.defaultSportScale,
        defaultTradScale: area.defaultTradScale,
        blocweatherUrl: area.blocweatherUrl,
      },
    };
  }
}
