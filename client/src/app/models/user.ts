import {AbstractModel} from './abstract-model';
import * as moment from 'moment';

/**
 * Model of a user.
 */
export class User extends AbstractModel {

  email: string;
  newEmail: string;
  firstname: string;
  lastname: string;
  password: string;
  activated: boolean;
  locked: boolean;
  activatedAt: moment.Moment;

  fullname: string;


  /**
   * Parses a user from a JSON representation.
   *
   * @param payload JSON representation of the user.
   * @return Parsed user.
   */
  public static deserialize(payload: any): User {
    const user = new User();
    AbstractModel.deserializeAbstractAttributes(user, payload);
    user.id = payload.id;
    user.email = payload.email;
    user.newEmail = payload.newEmail;
    user.firstname = payload.firstname;
    user.lastname = payload.lastname;
    user.activated = payload.activated;
    user.locked = payload.locked;
    user.activatedAt = moment.utc(payload.activatedAt).local();
    user.fullname = `${user.firstname} ${user.lastname}`;
    return user;
  }

  /**
   * Marshals a new User.
   *
   * @param user User to marshall.
   * @return Marshalled User.
   */
  public static serializeNewUser(user: User): any {
    return {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password: user.password,
    };
  }

  /**
   * Marshals contact information of a User.
   *
   * @param user User to marshall.
   * @return Marshalled User contact info.
   */
  public static serializeContactInfo(user: User): any {
    return {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email
    };
  }

}
