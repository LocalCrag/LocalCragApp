import { AbstractModel } from './abstract-model';
import { File } from './file';
import { Observable } from 'rxjs';
import { Grade } from '../utility/misc/grades';
import { Coordinates } from '../interfaces/coordinates.interface';
import { Sector } from './sector';
import { MapMarker } from './map-marker';

/**
 * Model of a climbing crag.
 */
export class Crag extends AbstractModel {
  name: string;
  description: string;
  shortDescription: string;
  rules: string;
  slug: string;
  portraitImage: File;
  orderIndex: number;
  sectors: Sector[];
  ascentCount: number;
  routerLink: string;
  secret: boolean;
  mapMarkers: MapMarker[];

  /**
   * Parses a crag.
   *
   * @param payload Crag json payload.
   * @return Parsed Crag.
   */
  public static deserialize(payload: any): Crag {
    const crag = new Crag();
    AbstractModel.deserializeAbstractAttributes(crag, payload);
    crag.name = payload.name;
    crag.description = payload.description;
    crag.shortDescription = payload.shortDescription;
    crag.rules = payload.rules;
    crag.slug = payload.slug;
    crag.secret = payload.secret;
    crag.orderIndex = payload.orderIndex;
    crag.portraitImage = payload.portraitImage
      ? File.deserialize(payload.portraitImage)
      : null;
    crag.sectors = payload.sectors
      ? payload.sectors.map(Sector.deserialize)
      : null;
    crag.ascentCount = payload.ascentCount;
    crag.mapMarkers = payload.mapMarkers
      ? payload.mapMarkers.map(MapMarker.deserialize)
      : null;
    crag.routerLink = `/topo/${crag.slug}`;
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
      name: crag.name,
      description: crag.description,
      shortDescription: crag.shortDescription,
      rules: crag.rules,
      secret: crag.secret,
      portraitImage: crag.portraitImage ? crag.portraitImage.id : null,
      mapMarkers: crag.mapMarkers
        ? crag.mapMarkers.map(MapMarker.serialize)
        : null,
    };
  }
}
