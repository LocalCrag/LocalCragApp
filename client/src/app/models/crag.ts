import {AbstractModel} from './abstract-model';

/**
 * Model of a climbing crag.
 */
export class Crag extends AbstractModel {

  name: string;
  description: string;
  rules: string;

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
    crag.rules = payload.rules;
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
      rules: crag.rules,
    };
  }

}
