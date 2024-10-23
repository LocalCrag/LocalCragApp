import { AbstractModel } from './abstract-model';
import { MenuItemType } from '../enums/menu-item-type';
import { MenuItemPosition } from '../enums/menu-item-position';
import { MenuPage } from './menu-page';

/**
 * Model of a menu item.
 */
export class MenuItem extends AbstractModel {
  type: MenuItemType;
  position: MenuItemPosition;
  menuPage: MenuPage;
  icon: string;

  /**
   * Parses a menu item.
   *
   * @param payload MenuItem json payload.
   * @return Parsed MenuItem.
   */
  public static deserialize(payload: any): MenuItem {
    const menuItem = new MenuItem();
    AbstractModel.deserializeAbstractAttributes(menuItem, payload);
    menuItem.type = payload.type;
    menuItem.position = payload.position;
    menuItem.icon = payload.icon;
    menuItem.menuPage = payload.menuPage
      ? MenuPage.deserialize(payload.menuPage)
      : null;
    return menuItem;
  }

  /**
   * Marshals a MenuItem.
   *
   * @param menuItem MenuItem to marshall.
   * @return Marshalled MenuItem.
   */
  public static serialize(menuItem: MenuItem): any {
    return {
      type: menuItem.type,
      position: menuItem.position,
      icon: menuItem.icon,
      menuPage: menuItem.menuPage ? menuItem.menuPage.id : null,
    };
  }
}
