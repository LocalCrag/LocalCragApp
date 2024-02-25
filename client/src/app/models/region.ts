import {AbstractModel} from './abstract-model';
import {File} from './file';
import {Observable} from 'rxjs';
import {Grade} from '../utility/misc/grades';

/**
 * Model of a climbing region.
 */
export class Region extends AbstractModel {

  name: string;
  description: string;
  slug: string;

  /**
   * Parses a region.
   *
   * @param payload Region json payload.
   * @return Parsed Region.
   */
  public static deserialize(payload: any): Region {
    const region = new Region();
    AbstractModel.deserializeAbstractAttributes(region, payload);
    region.name = payload.name;
    region.description = payload.description;
    region.slug = payload.slug;
    return region;
  }

  /**
   * Marshals a Region.
   *
   * @param region Region to marshall.
   * @return Marshalled Region.
   */
  public static serialize(region: Region): any {
    return {
      description: region.description,
    };
  }

}
