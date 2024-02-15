import * as moment from 'moment';
import {User} from './user';

/**
 * The most basic model.
 * The database base_entity's property created_by cannot be parsed here because importing User would result in circular
 * dependency issues.
 */
export class AbstractModel {

  id: string;
  timeCreated: moment.Moment;
  timeUpdated: moment.Moment;


  /**
   * Deserializes the common abstract model parameters.
   *
   * @param model The model to set the attributes on.
   * @param payload The payload to parse the attributes from.
   */
  public static deserializeAbstractAttributes(model: AbstractModel, payload: any): void {
    model.id = payload.id;
    model.timeCreated = moment.utc(payload.timeCreated).local();
    model.timeUpdated = moment.utc(payload.timeUpdated).local();
  }

}
