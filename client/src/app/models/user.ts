import { AbstractModel } from './abstract-model';
import { File } from './file';
import { LanguageCode } from '../utility/types/language';
import { ColorScheme } from '../services/core/theme.service';
import { deserializeSlugAttributes, HasSlug } from './mixins/has-slug';

/**
 * Model of a user.
 */
export class User extends HasSlug(AbstractModel) {
  email: string;
  newEmail: string;
  firstname: string;
  lastname: string;
  password: string;
  activated: boolean;
  superadmin: boolean;
  admin: boolean;
  moderator: boolean;
  member: boolean;
  activatedAt: Date;
  avatar: File;
  accountLanguage: LanguageCode;
  accountColorScheme: ColorScheme;

  fullname: string;
  routerLink: string;

  /**
   * Parses a user from a JSON representation.
   *
   * @param payload JSON representation of the user.
   * @return Parsed user.
   */
  public static deserialize(payload: any): User {
    const user = new User();
    AbstractModel.deserializeAbstractAttributes(user, payload);
    deserializeSlugAttributes(user, payload);
    user.id = payload.id;
    user.email = payload.email;
    user.newEmail = payload.newEmail;
    user.firstname = payload.firstname;
    user.lastname = payload.lastname;
    user.activated = payload.activated;
    user.superadmin = payload.superadmin;
    user.admin = payload.admin;
    user.moderator = payload.moderator;
    user.member = payload.member;
    user.activatedAt = new Date(payload.activatedAt + 'Z');
    user.fullname = `${user.firstname} ${user.lastname}`;
    user.avatar = payload.avatar ? File.deserialize(payload.avatar) : null;
    user.routerLink = `/users/${user.slug}`;
    user.accountLanguage = payload.accountLanguage;
    user.accountColorScheme = payload.accountColorScheme ?? 'system';
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
      avatar: user.avatar ? user.avatar.id : null,
    };
  }
}
