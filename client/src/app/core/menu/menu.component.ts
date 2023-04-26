import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../services/crud/crags.service';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {selectShowCookieAlert} from '../../ngrx/selectors/app-level-alerts.selectors';
import {selectIsLoggedIn} from '../../ngrx/selectors/auth.selectors';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit {

  items: MenuItem[] = [];
  userMenuItems: MenuItem[] = [];
  isLoggedIn$: Observable<boolean>;

  constructor(private cragsService: CragsService,
              private store: Store) {
  }

  ngOnInit() {
    this.userMenuItems = [
      {
        icon: 'pi pi-fw pi-pencil',
        label: 'Passwort ändern'
      },
      {
        label: 'Logout',
        icon: 'pi pi-fw pi-sign-out'
      }
    ]
    this.items = [
      {
        label: 'News',
        icon: 'pi pi-fw pi-megaphone'
      },
      {
        label: 'Topo',
        icon: 'pi pi-fw pi-map',
        items: [
          {
            label: 'Neues Gebiet',
            icon: 'pi pi-fw pi-plus',
          }
        ]
      },
      {
        label: 'Ticklist',
        icon: 'pi pi-fw pi-check-square'
      },
      {
        label: 'YouTube',
        url: 'https://www.youtube.com/channel/UCVcSFPVAiKbg3QLDNdXIl-Q',
        icon: 'pi pi-fw pi-youtube'
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
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
  }

}
