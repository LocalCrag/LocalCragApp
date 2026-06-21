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
import { topoCragRouterLink } from './topo-router-link';

/**
 * Model of a climbing crag.
 */
export class Crag extends IsClosable(HasOrderIndex(HasSlug(AbstractModel))) {
  name: string;
  description: string;
  shortDescription: string;
  rules: string;
  portraitImage: File;
  sectors: Sector[];
  lineCount: number;
  ascentCount: number;
  routerLink: string | null;
  secret: boolean;
  mapMarkers: MapMarker[];
  defaultBoulderScale: string | null = null;
  defaultSportScale: string | null = null;
  defaultTradScale: string | null = null;
  blocweatherUrl: string | null = null;

  /**
   * Parses a crag.
   *
   * @param payload Crag json payload.
   * @return Parsed Crag.
   */
  public static deserialize(payload: any): Crag {
    const crag = new Crag();
    AbstractModel.deserializeAbstractAttributes(crag, payload);
    deserializeClosableAttributes(crag, payload);
    deserializeSlugAttributes(crag, payload);
    deserializeOrderIndexAttributes(crag, payload);
    crag.name = payload.name;
    crag.description = payload.description;
    crag.shortDescription = payload.shortDescription;
    crag.rules = payload.rules;
    crag.secret = payload.secret;
    crag.portraitImage = payload.portraitImage
      ? File.deserialize(payload.portraitImage)
      : null;
    crag.sectors = payload.sectors
      ? payload.sectors.map(Sector.deserialize)
      : null;
    crag.lineCount = payload.lineCount;
    crag.ascentCount = payload.ascentCount;
    crag.mapMarkers = payload.mapMarkers
      ? payload.mapMarkers.map(MapMarker.deserialize)
      : null;
    crag.routerLink = topoCragRouterLink(crag);
    crag.defaultBoulderScale = payload.defaultBoulderScale;
    crag.defaultSportScale = payload.defaultSportScale;
    crag.defaultTradScale = payload.defaultTradScale;
    crag.blocweatherUrl = payload.blocweatherUrl ?? null;
    return crag;
  }

  /**
   * Marshals a Crag.
   *
   * @param crag Crag to marshall.
   * @return Marshalled Crag.
   */
  public static serialize(crag: Crag): any {
    return {
      ...serializeClosableAttributes(crag),
      ...{
        name: crag.name,
        description: crag.description,
        shortDescription: crag.shortDescription,
        rules: crag.rules,
        secret: crag.secret,
        portraitImage: crag.portraitImage ? crag.portraitImage.id : null,
        mapMarkers: crag.mapMarkers
          ? crag.mapMarkers.map(MapMarker.serialize)
          : null,
        defaultBoulderScale: crag.defaultBoulderScale,
        defaultSportScale: crag.defaultSportScale,
        defaultTradScale: crag.defaultTradScale,
        blocweatherUrl: crag.blocweatherUrl,
      },
    };
  }
}
