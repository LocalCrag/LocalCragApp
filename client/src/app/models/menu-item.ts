import {AbstractModel} from './abstract-model';
import {File} from './file';
import {Observable} from 'rxjs';
import {Grade} from '../utility/misc/grades';
import {User} from './user';
import {MenuItemType} from '../enums/menu-item-type';
import {MenuItemPosition} from '../enums/menu-item-position';
import {MenuPage} from './menu-page';

/**
 * Model of a menu item.
 */
export class MenuItem extends AbstractModel {

  type: MenuItemType;
  position: MenuItemPosition;
  orderIndex: number;
  menuPage: MenuPage;


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
    menuItem.orderIndex = payload.orderIndex;
    menuItem.menuPage = payload.menuPage ? MenuPage.deserialize(payload.menuPage) : null;
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
      menuPage: menuItem.menuPage?.id,
    };
  }

}
