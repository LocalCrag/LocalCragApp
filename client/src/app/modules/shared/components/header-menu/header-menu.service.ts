import {ChangeDetectorRef, Injectable} from '@angular/core';
import {ProcessedMenuItem} from './processed-menu-item';
import {HeaderMenuComponent} from './header-menu.component';

@Injectable()
export class HeaderMenuService {

  private activeItem: ProcessedMenuItem;
  private headerMenu: HeaderMenuComponent;

  constructor(private cdr: ChangeDetectorRef) {
  }

  public setActive(item: ProcessedMenuItem, itemElement: HTMLElement = null) {
    this.deactivateCurrent();
    this.activateItem(item);
    this.activeItem = item;
    // Leaf menu items won't have a sub menu element. They will just be set active.
    if (itemElement) {
      this.cdr.detectChanges(); // This is necessary to make sure the menu is rendered before we try to position it.
      this.fixItemOverflow(itemElement)
    }
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

  /**
   * Detects and fixes menu overflow by three different measures:
   * 1: If the menu overflows at the bottom, and we have enough space, we move it up.
   * 2: If it is too high, we make it scrollable and move it to the top of the window.
   * 3: If it overflows at the right, we make it appear at the left of it's parent instead of the right.
   */
  fixItemOverflow(itemElement: HTMLElement) {
    const itemElementRect = itemElement.getBoundingClientRect();
    const overflowBottomAmount = itemElementRect.bottom - window.innerHeight;
    const overflowRightAmount = itemElementRect.right - window.innerWidth;
    const itemElementHeight = itemElement.offsetHeight;

    // Case 1
    if (overflowBottomAmount > 0 && !(itemElementHeight > window.innerHeight)) {
      itemElement.style.setProperty('top', `-${overflowBottomAmount}px`, 'important');
    }

    // Case 2
    if (itemElementHeight > window.innerHeight) {
      itemElement.style.setProperty('top', `-${itemElementRect.top}px`, 'important');
      itemElement.style.setProperty('height', `${window.innerHeight}px`, 'important');
      itemElement.style.setProperty('overflow-y', 'auto', 'important');
    }

    // Case 3
    if (overflowRightAmount > 0) {
      itemElement.style.setProperty('left', `-${itemElementRect.width }px`, 'important');
    }

  }

}
