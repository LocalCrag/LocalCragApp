import { AbstractModel } from './abstract-model';
import { File } from './file';

/**
 * Model of a climbing region.
 */
export class Region extends AbstractModel {
  name: string;
  description: string;
  rules: string;
  image: File;
  ascentCount: number;
  imageCount: number;
  commentCount: number;
  cragCount: number;
  lineCount: number;
  taskCount?: number;

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
    region.rules = payload.rules;
    region.image = payload.image ? File.deserialize(payload.image) : null;
    region.ascentCount = payload.ascentCount;
    region.imageCount = payload.imageCount;
    region.commentCount = payload.commentCount;
    region.cragCount = payload.cragCount;
    region.lineCount = payload.lineCount;
    region.taskCount = payload.taskCount;
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
      image: region.image ? region.image.id : null,
    };
  }
}
