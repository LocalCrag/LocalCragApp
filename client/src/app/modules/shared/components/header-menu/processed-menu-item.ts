import { MenuItem } from '../../models/menu-item';

export class ProcessedMenuItem {
  isActive = false;
  parent: ProcessedMenuItem;
  item: MenuItem;
  items: ProcessedMenuItem[];
}
