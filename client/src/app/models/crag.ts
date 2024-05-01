import {AbstractModel} from './abstract-model';
import {File} from './file';
import {Observable} from 'rxjs';
import {Grade} from '../utility/misc/grades';
import {GPS} from '../interfaces/gps.interface';
import {Sector} from './sector';

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
  gps: GPS;
  sectors: Sector[];
  ascentCount: number;
  routerLink: string;

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
    crag.gps = payload.lng && payload.lat ? {lat: payload.lat, lng: payload.lng} : null;
    crag.orderIndex = payload.orderIndex;
    crag.portraitImage = payload.portraitImage ? File.deserialize(payload.portraitImage) : null;
    crag.sectors = payload.sectors ? payload.sectors.map(Sector.deserialize) : null;
    crag.ascentCount = payload.ascentCount;
    crag.routerLink =`/topo/${crag.slug}`;
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
      lng: crag.gps ? crag.gps.lng : null,
      lat: crag.gps ? crag.gps.lat : null,
      portraitImage: crag.portraitImage ? crag.portraitImage.id : null,
    };
  }

}
