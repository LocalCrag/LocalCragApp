/**
 * The most basic model.
 * The database base_entity's property created_by cannot be parsed here because importing User would result in circular
 * dependency issues.
 */
export class AbstractModel {
  id: string;
  timeCreated: Date;
  timeUpdated: Date;

  /**
   * Deserializes the common abstract model parameters.
   *
   * @param model The model to set the attributes on.
   * @param payload The payload to parse the attributes from.
   */
  public static deserializeAbstractAttributes(
    model: AbstractModel,
    payload: any,
  ): void {
    model.id = payload.id;
    model.timeCreated = payload.timeCreated
      ? new Date(payload.timeCreated + 'Z')
      : null;
    model.timeUpdated = payload.timeUpdated
      ? new Date(payload.timeUpdated + 'Z')
      : null;
  }
}
