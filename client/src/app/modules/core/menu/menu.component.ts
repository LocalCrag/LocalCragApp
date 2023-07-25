import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../../services/crud/crags.service';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {selectShowCookieAlert} from '../../../ngrx/selectors/app-level-alerts.selectors';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {logout} from 'src/app/ngrx/actions/auth.actions';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {filter, take} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';

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
  isMobile$: Observable<boolean>;

  constructor(private cragsService: CragsService,
              private translocoService: TranslocoService,
              private store: Store) {
  }

  ngOnInit() {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
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
          routerLinkActiveOptions: {exact: true}
        },
        {
          label: this.translocoService.translate(marker('menu.topo')),
          icon: 'pi pi-fw pi-map',
          routerLink: '/topo',
          items: [
            {
              label: this.translocoService.translate(marker('menu.newCrag')),
              icon: 'pi pi-fw pi-plus',
              routerLink: '/topo/create-crag',
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
        {
          label: this.translocoService.translate(marker('menu.instagram')),
          url: 'https://www.instagram.com/gleesbouldering/',
          icon: 'pi pi-fw pi-instagram'
        },
      ];
      this.cragsService.getCrags().subscribe(crags => {
        crags.map(crag => {
          this.items[1].items.splice(-2, 0, {
            label: crag.name,
            icon: 'pi pi-fw pi-map',
            routerLink: `/topo/${crag.slug}`
          })
        })
      })
    });
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  /**
   * Logs out the user.
   */
  logout() {
    this.store.dispatch(logout({isAutoLogout: false, silent: false}));
  }

}
