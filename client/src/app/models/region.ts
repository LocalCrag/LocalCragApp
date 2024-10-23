import { AbstractModel } from './abstract-model';

/**
 * Model of a climbing region.
 */
export class Region extends AbstractModel {
  name: string;
  description: string;
  slug: string;
  rules: string;
  ascentCount: number;

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
    region.rules = payload.rules;
    region.ascentCount = payload.ascentCount;
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
      name: region.name,
      description: region.description,
      rules: region.rules,
    };
  }
}
