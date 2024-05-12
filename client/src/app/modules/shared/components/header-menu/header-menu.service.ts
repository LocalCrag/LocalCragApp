import {Injectable} from '@angular/core';
import {ProcessedMenuItem} from './processed-menu-item';
import {HeaderMenuComponent} from './header-menu.component';

@Injectable()
export class HeaderMenuService {

  private activeItem: ProcessedMenuItem;
  private headerMenu: HeaderMenuComponent;

  public setActive(item: ProcessedMenuItem) {
    this.deactivateCurrent();
    this.activateItem(item);
    this.activeItem = item;
  }

  public toggleActive(item: ProcessedMenuItem) {
    if (item.isActive) {
      item = item.parent
    }
    if (item) {
      this.setActive(item);
    } else {
      this.deactivateCurrent();
    }
  }

  public deactivateCurrent() {
    if (this.activeItem) {
      this.deactivateItem(this.activeItem);
    }
  }

  private deactivateItem(item: ProcessedMenuItem) {
    item.isActive = false;
    if (item.parent) {
      this.deactivateItem(item.parent);
    }
  }

  private activateItem(item: ProcessedMenuItem) {
    item.isActive = true;
    if (item.parent) {
      this.activateItem(item.parent);
    }
  }

  public registerHeaderMenu(headerMenu: HeaderMenuComponent) {
    this.headerMenu = headerMenu;
  }

  public collapseMobileMenu() {
    this.headerMenu.mobileExpanded = false;
  }

}
