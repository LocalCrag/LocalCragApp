import {AbstractModel} from './abstract-model';
import {File} from './file';
import {Coordinates} from '../interfaces/coordinates.interface';
import {Area} from './area';
import {A} from '@angular/cdk/keycodes';
import {Crag} from './crag';
import {MapMarker} from './map-marker';

/**
 * Model of a climbing crag's sector.
 */
export class Sector extends AbstractModel {

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


  /**
   * Parses a sector.
   *
   * @param payload Sector json payload.
   * @return Parsed Sector.
   */
  public static deserialize(payload: any): Sector {
    const sector = new Sector();
    AbstractModel.deserializeAbstractAttributes(sector, payload);
    sector.name = payload.name;
    sector.description = payload.description;
    sector.secret = payload.secret;
    sector.shortDescription = payload.shortDescription;
    sector.slug = payload.slug;
    sector.orderIndex = payload.orderIndex;
    sector.rules = payload.rules;
    sector.portraitImage = payload.portraitImage ? File.deserialize(payload.portraitImage) : null;
    sector.areas = payload.areas ? payload.areas.map(Area.deserialize) : null;
    sector.crag = payload.crag ? Crag.deserialize(payload.crag) : null;
    sector.ascentCount = payload.ascentCount;
    sector.mapMarkers = payload.mapMarkers ? payload.mapMarkers.map(MapMarker.deserialize) : null;
    sector.routerLink = sector.crag ? `/topo/${sector.crag.slug}/${sector.slug}` : null;
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
      name: sector.name,
      description: sector.description,
      shortDescription: sector.shortDescription,
      secret: sector.secret,
      portraitImage: sector.portraitImage ? sector.portraitImage.id : null,
      rules: sector.rules,
      mapMarkers: sector.mapMarkers ? sector.mapMarkers.map(MapMarker.serialize) : null,
    };
  }

}

