import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MenuItem} from 'primeng/api';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit {

  items: MenuItem[] = [];

  ngOnInit() {
    this.items = [
      {
        label: 'Aktionen',
        icon: 'pi pi-fw pi-megaphone'
      },
      {
        label: 'Kalender',
        icon: 'pi pi-fw pi-calendar',
      }
    ];
  }

}
