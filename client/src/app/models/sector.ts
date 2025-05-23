import { AbstractModel } from './abstract-model';
import { File } from './file';
import { Area } from './area';
import { Crag } from './crag';
import { MapMarker } from './map-marker';
import {
  deserializeClosableAttributes,
  IsClosable,
  serializeClosableAttributes,
} from './mixins/is-closable';

/**
 * Model of a climbing crag's sector.
 */
export class Sector extends IsClosable(AbstractModel) {
  name: string;
  description: string;
  shortDescription: string;
  slug: string;
  portraitImage: File;
  orderIndex: number;
  rules: string;
  areas: Area[];
  crag: Crag;
  ascentCount: number;
  routerLink: string;
  secret: boolean;
  mapMarkers: MapMarker[];
  defaultBoulderScale: string | null = null;
  defaultSportScale: string | null = null;
  defaultTradScale: string | null = null;

  /**
   * Parses a sector.
   *
   * @param payload Sector json payload.
   * @return Parsed Sector.
   */
  public static deserialize(payload: any): Sector {
    const sector = new Sector();
    AbstractModel.deserializeAbstractAttributes(sector, payload);
    deserializeClosableAttributes(sector, payload);
    sector.name = payload.name;
    sector.description = payload.description;
    sector.secret = payload.secret;
    sector.shortDescription = payload.shortDescription;
    sector.slug = payload.slug;
    sector.orderIndex = payload.orderIndex;
    sector.rules = payload.rules;
    sector.portraitImage = payload.portraitImage
      ? File.deserialize(payload.portraitImage)
      : null;
    sector.areas = payload.areas ? payload.areas.map(Area.deserialize) : null;
    sector.crag = payload.crag ? Crag.deserialize(payload.crag) : null;
    sector.ascentCount = payload.ascentCount;
    sector.mapMarkers = payload.mapMarkers
      ? payload.mapMarkers.map(MapMarker.deserialize)
      : null;
    sector.routerLink = sector.crag
      ? `/topo/${sector.crag.slug}/${sector.slug}`
      : null;
    sector.defaultBoulderScale = payload.defaultBoulderScale;
    sector.defaultSportScale = payload.defaultSportScale;
    sector.defaultTradScale = payload.defaultTradScale;
    return sector;
  }

  /**
   * Marshals a Sector.
   *
   * @param sector Sector to marshall.
   * @return Marshalled Sector.
   */
  public static serialize(sector: Sector): any {
    return {
      ...serializeClosableAttributes(sector),
      ...{
        name: sector.name,
        description: sector.description,
        shortDescription: sector.shortDescription,
        secret: sector.secret,
        portraitImage: sector.portraitImage ? sector.portraitImage.id : null,
        rules: sector.rules,
        mapMarkers: sector.mapMarkers
          ? sector.mapMarkers.map(MapMarker.serialize)
          : null,
        defaultBoulderScale: sector.defaultBoulderScale,
        defaultSportScale: sector.defaultSportScale,
        defaultTradScale: sector.defaultTradScale,
      },
    };
  }
}
