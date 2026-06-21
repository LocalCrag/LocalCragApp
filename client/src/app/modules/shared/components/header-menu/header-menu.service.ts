import { ChangeDetectorRef, Injectable, inject } from '@angular/core';
import { ProcessedMenuItem } from './processed-menu-item';
import { HeaderMenuComponent } from './header-menu.component';
import {
  applyHeaderSubmenuPosition,
  calculateHeaderSubmenuPosition,
  headerSubmenuPositionsEqual,
  measureSubmenuContentHeight,
  resetHeaderSubmenuPosition,
} from './position-header-submenu';

/** DOM refs and cached layout for one open submenu panel. */
interface PositionedSubmenuState {
  submenu: HTMLElement;
  /** Hovered `.item` row; vertical alignment and first-level horizontal origin. */
  anchor: HTMLElement;
  /** Parent `lc-header-menu-sub` panel; horizontal flyout alignment for nested menus. */
  panel?: HTMLElement;
  isFirstChild: boolean;
  lastPosition?: ReturnType<typeof calculateHeaderSubmenuPosition>;
}

/**
 * Shared state for the desktop/mobile header menu tree.
 *
 * Open desktop submenus are laid out with `position: fixed` via
 * `position-header-submenu.ts` (short viewports and deep flyouts need viewport
 * coordinates). Each hovered branch keeps a `PositionedSubmenuState` so ancestor
 * panels stay aligned while the user moves between siblings.
 */
@Injectable()
export class HeaderMenuService {
  private cdr = inject(ChangeDetectorRef);
  private activeItem: ProcessedMenuItem;
  private headerMenu: HeaderMenuComponent;
  private preventNextMobileMenuCollapse = false;
  private submenuStates = new Map<ProcessedMenuItem, PositionedSubmenuState>();

  /**
   * Activates a menu branch on hover (desktop) and positions its submenu.
   *
   * @param item Model node to activate (ancestors are activated too).
   * @param submenuElement Child `lc-header-menu-sub` to show, if any.
   * @param anchorElement Hovered `.item` element.
   * @param isFirstChild True for dropdowns directly under the root menu bar.
   * @param panelElement Parent submenu panel for nested flyout horizontal alignment.
   */
  public setActive(
    item: ProcessedMenuItem,
    submenuElement: HTMLElement = null,
    anchorElement: HTMLElement = null,
    isFirstChild = false,
    panelElement: HTMLElement = null,
  ) {
    this.deactivateItemsWithoutResettingPositions();
    this.activateItem(item);
    this.activeItem = item;

    if (submenuElement && anchorElement) {
      this.submenuStates.set(item, {
        submenu: submenuElement,
        anchor: anchorElement,
        panel: panelElement ?? undefined,
        isFirstChild,
      });
      this.cdr.detectChanges();
      this.repositionActiveSubmenus(item);
    }
  }

  /**
   * Toggles a branch on mobile (angle icon click).
   * Re-clicking the open branch collapses back to its parent; clicking a closed branch opens it.
   */
  public toggleActive(item: ProcessedMenuItem) {
    if (item.isActive) {
      item = item.parent;
    }
    if (item) {
      this.setActive(item);
    } else {
      this.deactivateCurrent();
    }
  }

  /**
   * Closes the active branch and clears all fixed-position inline styles.
   * Called on outside click, navigation, and when collapsing the mobile menu.
   */
  public deactivateCurrent() {
    this.resetPositionedSubmenus();
    if (this.activeItem) {
      this.deactivateItem(this.activeItem);
    }
  }

  /**
   * Deactivates the current branch without clearing positioned submenu styles.
   * Used at the start of `setActive` so ancestor panels keep their layout until the new branch is applied.
   */
  private deactivateItemsWithoutResettingPositions() {
    if (this.activeItem) {
      this.deactivateItem(this.activeItem);
    }
  }

  /**
   * Marks `item` and all of its ancestors as inactive (`isActive = false`).
   */
  private deactivateItem(item: ProcessedMenuItem) {
    item.isActive = false;
    if (item.parent) {
      this.deactivateItem(item.parent);
    }
  }

  /**
   * Marks `item` and all of its ancestors as active (`isActive = true`).
   */
  private activateItem(item: ProcessedMenuItem) {
    item.isActive = true;
    if (item.parent) {
      this.activateItem(item.parent);
    }
  }

  /**
   * Stores a reference to the root `HeaderMenuComponent` for mobile expand/collapse.
   * Called once from `HeaderMenuComponent.ngOnInit`.
   */
  public registerHeaderMenu(headerMenu: HeaderMenuComponent) {
    this.headerMenu = headerMenu;
  }

  /**
   * Called to collapse the mobile menu. The preventNextMobileMenuCollapse flag is needed, because
   * when opening the mobile menu, the click event bubbles and would close the menu immediately.
   * Stopping propagation is no option, as the bubbling is still needed, to close other menus that might be eventually
   * open, like the user menu.
   */
  public collapseMobileMenu() {
    if (!this.preventNextMobileMenuCollapse) {
      this.headerMenu.mobileExpanded = false;
    } else {
      this.preventNextMobileMenuCollapse = false;
    }
  }

  /**
   * Suppresses the next `collapseMobileMenu` call.
   * Set to `true` when opening the mobile menu so the opening click does not immediately close it.
   */
  public setPreventNextMobileMenuCollapse(value: boolean) {
    this.preventNextMobileMenuCollapse = value;
  }

  /**
   * Repositions every submenu in the active ancestor chain and drops stale entries.
   * Called after each hover so parent scroll position and flyout columns stay stable.
   */
  private repositionActiveSubmenus(leafItem: ProcessedMenuItem) {
    const activeChain = new Set<ProcessedMenuItem>();
    let current: ProcessedMenuItem | null = leafItem;
    while (current) {
      activeChain.add(current);
      current = current.parent;
    }

    for (const [item, state] of this.submenuStates) {
      if (!activeChain.has(item)) {
        resetHeaderSubmenuPosition(state.submenu);
        this.submenuStates.delete(item);
      }
    }

    for (const item of activeChain) {
      const state = this.submenuStates.get(item);
      if (state) {
        this.applyPositionFromState(state);
      }
    }
  }

  /**
   * Applies viewport-fixed layout to one submenu. Skips DOM writes when the layout
   * is unchanged so scroll position is not reset while moving between siblings.
   */
  private applyPositionFromState(state: PositionedSubmenuState) {
    const position = calculateHeaderSubmenuPosition({
      anchorRect: state.anchor.getBoundingClientRect(),
      panelRect: state.panel?.getBoundingClientRect(),
      submenuWidth: state.submenu.offsetWidth,
      submenuHeight: measureSubmenuContentHeight(state.submenu),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      isFirstChild: state.isFirstChild,
    });

    if (headerSubmenuPositionsEqual(state.lastPosition, position)) {
      return;
    }

    applyHeaderSubmenuPosition(state.submenu, position);
    state.lastPosition = position;
  }

  /**
   * Removes fixed-position inline styles from every tracked submenu and clears `submenuStates`.
   */
  private resetPositionedSubmenus() {
    for (const state of this.submenuStates.values()) {
      resetHeaderSubmenuPosition(state.submenu);
    }
    this.submenuStates.clear();
  }
}
