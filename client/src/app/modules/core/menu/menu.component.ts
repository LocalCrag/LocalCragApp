import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MenuItem} from 'primeng/api';
import {CragsService} from '../../../services/crud/crags.service';
import {select, Store} from '@ngrx/store';
import {forkJoin, Observable} from 'rxjs';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {cleanupCredentials, logout, newAuthCredentials} from 'src/app/ngrx/actions/auth.actions';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {take} from 'rxjs/operators';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {Actions, ofType} from '@ngrx/effects';
import {reloadMenus} from '../../../ngrx/actions/core.actions';
import {MenuItemsService} from '../../../services/crud/menu-items.service';
import {MenuItemPosition} from '../../../enums/menu-item-position';
import {MenuItemType} from '../../../enums/menu-item-type';
import {Crag} from '../../../models/crag';
import {
  selectInstagramUrl, selectInstanceName,
  selectLogoImage,
  selectYoutubeUrl
} from '../../../ngrx/selectors/instance-settings.selectors';
import {File} from '../../../models/file';

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
  logoImage$: Observable<File>;
  instanceName$: Observable<string>;

  constructor(private cragsService: CragsService,
              private menuItemsService: MenuItemsService,
              private translocoService: TranslocoService,
              private actions: Actions,
              private store: Store) {
  }

  ngOnInit() {
    this.userMenuItems = [
      {
        icon: 'pi pi-fw pi-pencil',
        label: this.translocoService.translate(marker('menu.changePassword')),
        routerLink: '/change-password'
      },
      {
        icon: 'pi pi-fw pi-file',
        label: this.translocoService.translate(marker('menu.menuPages')),
        routerLink: '/pages'
      },
      {
        icon: 'pi pi-fw pi-bars',
        label: this.translocoService.translate(marker('menu.menus')),
        routerLink: '/menu-items'
      },
      {
        icon: 'pi pi-fw pi-cog',
        label: this.translocoService.translate(marker('menu.instanceSettings')),
        routerLink: '/instance-settings'
      },
      {
        label: this.translocoService.translate(marker('menu.logout')),
        icon: 'pi pi-fw pi-sign-out',
        command: this.logout.bind(this),
      }
    ]
    this.logoImage$ = this.store.pipe(select(selectLogoImage));
    this.instanceName$ = this.store.pipe(select(selectInstanceName));
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.buildMenu();
    this.actions.pipe(ofType(reloadMenus, newAuthCredentials, cleanupCredentials)).subscribe(() => {
      this.buildMenu();
    })
  }

  buildMenu() {
    forkJoin([
      this.menuItemsService.getMenuItems(),
      this.cragsService.getCrags(),
      this.store.select(selectYoutubeUrl).pipe(take(1)),
      this.store.select(selectInstagramUrl).pipe(take(1)),
      this.isLoggedIn$.pipe(take(1))
    ]).subscribe(([menuItems, crags,youtubeUrl, instagramUrl, isLoggedIn]) => {
      this.items = [];
      const menuItemsTop = menuItems.filter(menuItem => menuItem.position === MenuItemPosition.TOP);
      menuItemsTop.map(menuItem => {
        switch (menuItem.type) {
          case MenuItemType.MENU_PAGE:
            this.items.push({
              label: menuItem.menuPage.title,
              icon: `pi pi-fw ${menuItem.icon}`,
              routerLink: 'pages/' + menuItem.menuPage.slug,
            })
            break;
          case MenuItemType.NEWS:
            this.items.push({
              label: this.translocoService.translate(marker('menu.news')),
              icon: 'pi pi-fw pi-megaphone',
              routerLink: '/news',
            });
            break;
          case MenuItemType.INSTAGRAM:
            this.items.push({
              label: this.translocoService.translate(marker('menu.instagram')),
              url: instagramUrl,
              icon: 'pi pi-fw pi-instagram'
            });
            break;
          case MenuItemType.YOUTUBE:
            this.items.push({
              label: this.translocoService.translate(marker('menu.youtube')),
              url: youtubeUrl,
              icon: 'pi pi-fw pi-youtube'
            });
            break;
          case MenuItemType.TOPO:
            this.items.push({
              label: this.translocoService.translate(marker('menu.topo')),
              icon: 'pi pi-fw pi-map',
              routerLink: '/topo/crags',
              items: this.buildCragNavigationMenu(crags, isLoggedIn)
            });
            break;
        }
      });
    })
  }

  buildCragNavigationMenu(crags: Crag[], isLoggedIn: boolean) {
    const cragItems = [];
    crags.map(crag => {
      cragItems.push({
        label: crag.name,
        icon: 'pi pi-fw pi-map',
        routerLink: `/topo/${crag.slug}`
      })
    })
    if (isLoggedIn) {
      cragItems.push({
        label: this.translocoService.translate(marker('menu.newCrag')),
        icon: 'pi pi-fw pi-plus',
        routerLink: '/topo/create-crag',
      })
    }
    return cragItems;
  }

  /**
   * Logs out the user.
   */
  logout() {
    this.store.dispatch(logout({isAutoLogout: false, silent: false}));
  }

}
