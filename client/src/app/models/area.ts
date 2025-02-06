import { AbstractModel } from './abstract-model';
import { File } from './file';
import { Sector } from './sector';
import { MapMarker } from './map-marker';
import {
  deserializeClosableAttributes,
  IsClosable,
  serializeClosableAttributes,
} from './mixins/is-closable';

/**
 * Model of a climbing sector's area.
 */
export class Area extends IsClosable(AbstractModel) {
  name: string;
  description: string;
  shortDescription: string;
  slug: string;
  portraitImage: File;
  orderIndex: number;
  ascentCount: number;
  secret: boolean;
  mapMarkers: MapMarker[];
  defaultBoulderScale: string | null = null;
  defaultSportScale: string | null = null;
  defaultTradScale: string | null = null;

  sector: Sector;
  routerLink: string;

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
    area.name = payload.name;
    area.description = payload.description;
    area.shortDescription = payload.shortDescription;
    area.slug = payload.slug;
    area.orderIndex = payload.orderIndex;
    area.portraitImage = payload.portraitImage
      ? File.deserialize(payload.portraitImage)
      : null;
    area.sector = payload.sector ? Sector.deserialize(payload.sector) : null;
    area.ascentCount = payload.ascentCount;
    area.secret = payload.secret;
    area.mapMarkers = payload.mapMarkers
      ? payload.mapMarkers.map(MapMarker.deserialize)
      : null;
    area.routerLink = area.sector
      ? `/topo/${area.sector.crag.slug}/${area.sector.slug}/${area.slug}`
      : null;
    area.defaultBoulderScale = payload.defaultBoulderScale;
    area.defaultSportScale = payload.defaultSportScale;
    area.defaultTradScale = payload.defaultTradScale;
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
      },
    };
  }
}
