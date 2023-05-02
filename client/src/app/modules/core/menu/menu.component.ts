import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../../services/crud/crags.service';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {selectShowCookieAlert} from '../../../ngrx/selectors/app-level-alerts.selectors';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import { logout } from 'src/app/ngrx/actions/auth.actions';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'lc-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MenuComponent implements OnInit {

  items: MenuItem[] = [];
  userMenuItems: MenuItem[] = [];
  isLoggedIn$: Observable<boolean>;

  constructor(private cragsService: CragsService,
              private translocoService: TranslocoService,
              private store: Store) {
  }

  ngOnInit() {
    this.translocoService.events$.pipe(
      filter(e => e.type === 'translationLoadSuccess')
    ).subscribe(()=>{
      this.userMenuItems = [
        {
          icon: 'pi pi-fw pi-pencil',
          label: this.translocoService.translate(marker('menu.changePassword')),
          routerLink: '/change-password'
        },
        {
          label: this.translocoService.translate(marker('menu.logout')),
          icon: 'pi pi-fw pi-sign-out',
          command: this.logout.bind(this)
        }
      ]
      this.items = [
        {
          label: this.translocoService.translate(marker('menu.news')),
          icon: 'pi pi-fw pi-megaphone',
          routerLink: '/',
          routerLinkActiveOptions: { exact: true }
        },
        {
          label: this.translocoService.translate(marker('menu.topo')),
          icon: 'pi pi-fw pi-map',
          items: [
            {
              label: this.translocoService.translate(marker('menu.newCrag')),
              icon: 'pi pi-fw pi-plus',
            }
          ]
        },
        {
          label: this.translocoService.translate(marker('menu.ticklist')),
          icon: 'pi pi-fw pi-check-square'
        },
        {
          label: this.translocoService.translate(marker('menu.youtube')),
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
    });
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
  }

  /**
   * Logs out the user.
   */
  logout() {
    this.store.dispatch(logout({isAutoLogout: false, silent: false}));
  }

}
