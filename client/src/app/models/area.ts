import {AbstractModel} from './abstract-model';
import {File} from './file';

/**
 * Model of a climbing sector's area.
 */
export class Area extends AbstractModel {

  name: string;
  description: string;
  shortDescription: string;
  slug: string;
  portraitImage: File;
  lat: number;
  lng: number;
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
    area.lat = payload.lat;
    area.lng = payload.lng;
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
      lat: area.lat,
      lng: area.lng,
      portraitImage: area.portraitImage ? area.portraitImage.id : null,
    };
  }

}
