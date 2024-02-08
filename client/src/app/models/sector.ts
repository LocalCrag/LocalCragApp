import {AbstractModel} from './abstract-model';
import {File} from './file';

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
    sector.orderIndex = payload.orderIndex;
    sector.portraitImage = payload.portraitImage ? File.deserialize(payload.portraitImage) : null;
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
    };
  }

}
