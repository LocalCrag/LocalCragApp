import {AbstractModel} from './abstract-model';
import {File} from './file';

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
    crag.portraitImage = payload.portraitImage ? File.deserialize(payload.portraitImage) : null;
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
      portraitImage: crag.portraitImage ? crag.portraitImage.id : null,
    };
  }

}
