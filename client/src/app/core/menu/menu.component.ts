import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../services/crud/crags.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit {

  items: MenuItem[] = [];

  constructor(private cragsService: CragsService) {
  }

  ngOnInit() {
    this.items = [
      {
        label: 'News',
        icon: 'pi pi-fw pi-megaphone'
      },
    ];
    this.cragsService.getCrags().subscribe(crags => {
      crags.map(crag => {
        this.items.push({
          label: crag.name,
          icon: 'pi pi-fw pi-map',
        })
      })
    })

  }

}
