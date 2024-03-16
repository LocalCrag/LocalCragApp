import {AbstractModel} from './abstract-model';
import {File} from './file';
import {GPS} from '../interfaces/gps.interface';

/**
 * Model of a climbing sector's area.
 */
export class Area extends AbstractModel {

  name: string;
  description: string;
  shortDescription: string;
  slug: string;
  portraitImage: File;
  gps: GPS;
  orderIndex: number;

  /**
   * Parses an area.
   *
   * @param payload Area json payload.
   * @return Parsed Area.
   */
  public static deserialize(payload: any): Area {
    const area = new Area();
    AbstractModel.deserializeAbstractAttributes(area, payload);
    area.name = payload.name;
    area.description = payload.description;
    area.shortDescription = payload.shortDescription;
    area.gps = payload.lng && payload.lat ? {lat: payload.lat, lng: payload.lng} : null;
    area.slug = payload.slug;
    area.orderIndex = payload.orderIndex;
    area.portraitImage = payload.portraitImage ? File.deserialize(payload.portraitImage) : null;
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
      name: area.name,
      description: area.description,
      shortDescription: area.shortDescription,
      lng: area.gps ? area.gps.lng : null,
      lat: area.gps ? area.gps.lat : null,
      portraitImage: area.portraitImage ? area.portraitImage.id : null,
    };
  }

}
