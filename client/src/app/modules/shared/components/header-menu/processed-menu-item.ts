import {MenuItem} from 'primeng/api';

export class ProcessedMenuItem {
  isActive = false;
  parent: ProcessedMenuItem;
  item: MenuItem;
  items: ProcessedMenuItem[];
}
