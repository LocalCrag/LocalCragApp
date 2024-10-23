import { AbstractModel } from './abstract-model';

/**
 * Model of a menu page.
 */
export class MenuPage extends AbstractModel {
  title: string;
  text: string;
  slug: string;

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
