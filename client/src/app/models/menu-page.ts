import {AbstractModel} from './abstract-model';
import {File} from './file';
import {Observable} from 'rxjs';
import {Grade} from '../utility/misc/grades';
import {User} from './user';

/**
 * Model of a menu page.
 */
export class MenuPage extends AbstractModel {

  title: string;
  text: string;
  slug: string;
  createdBy: User;

  /**
   * Parses a menu page.
   *
   * @param payload MenuPage json payload.
   * @return Parsed MenuPage.
   */
  public static deserialize(payload: any): MenuPage {
    const menuPage = new MenuPage();
    AbstractModel.deserializeAbstractAttributes(menuPage, payload);
    menuPage.title = payload.title;
    menuPage.text = payload.text;
    menuPage.slug = payload.slug;
    menuPage.createdBy =User.deserialize(payload.createdBy);
    return menuPage;
  }

  /**
   * Marshals a MenuPage.
   *
   * @param menuPage MenuPage to marshall.
   * @return Marshalled MenuPage.
   */
  public static serialize(menuPage: MenuPage): any {
    return {
      title: menuPage.title,
      text: menuPage.text,
    };
  }

}
