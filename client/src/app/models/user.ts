import {AbstractModel} from './abstract-model';
import {File} from './file';

/**
 * Model of a user.
 */
export class User extends AbstractModel {

  email: string;
  newEmail: string;
  firstname: string;
  lastname: string;
  slug: string;
  password: string;
  activated: boolean;
  admin: boolean;
  moderator: boolean;
  member: boolean;
  activatedAt: Date;
  avatar: File;

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
    user.slug = payload.slug;
    user.activated = payload.activated;
    user.admin = payload.admin;
    user.moderator = payload.moderator;
    user.member = payload.member;
    user.activatedAt = new Date(payload.activatedAt + 'Z');
    user.fullname = `${user.firstname} ${user.lastname}`;
    user.avatar = payload.avatar ? File.deserialize(payload.avatar) : null;
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
    };
  }

  /**
   * Marshals contact information of a User.
   *
   * @param user User to marshall.
   * @return Marshalled User contact info.
   */
  public static serializeAccountInfo(user: User): any {
    return {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      avatar: user.avatar.id,
    };
  }

}
