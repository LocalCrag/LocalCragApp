export interface MenuItemCommandEvent {
  originalEvent?: Event;
  item?: MenuItem;
  index?: number;
}

/**
 * Local stand-in for the menu item shape previously imported from PrimeNG.
 * Fields stay optional so existing menu models remain assignable.
 */
export interface MenuItem {
  label?: string;
  icon?: string;
  command?: (event?: MenuItemCommandEvent) => void;
  url?: string;
  items?: MenuItem[];
  expanded?: boolean;
  disabled?: boolean;
  visible?: boolean;
  target?: string;
  separator?: boolean;
  id?: string;
  routerLink?: any;
  routerLinkActiveOptions?: { exact?: boolean; [key: string]: any };
  styleClass?: string;
  [key: string]: any;
}
