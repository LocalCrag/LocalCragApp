import {AbstractModel} from './abstract-model';
import {File} from './file';
import {GPS} from '../interfaces/gps.interface';
import {Area} from './area';
import {A} from '@angular/cdk/keycodes';
import {Crag} from './crag';

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
  gps: GPS;
  rules: string;
  areas: Area[];
  crag: Crag;

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
    sector.shortDescription = payload.shortDescription;
    sector.slug = payload.slug;
    sector.gps = payload.lng && payload.lat ? {lat: payload.lat, lng: payload.lng} : null;
    sector.orderIndex = payload.orderIndex;
    sector.rules = payload.rules;
    sector.portraitImage = payload.portraitImage ? File.deserialize(payload.portraitImage) : null;
    sector.areas = payload.areas ? payload.areas.map(Area.deserialize) : null;
    sector.crag = payload.crag ? Crag.deserialize(payload.crag) : null;
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
      portraitImage: sector.portraitImage ?  sector.portraitImage.id : null,
      lng: sector.gps ? sector.gps.lng : null,
      lat: sector.gps ? sector.gps.lat : null,
      rules: sector.rules,
    };
  }

}
