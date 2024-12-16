import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { select, Store } from '@ngrx/store';
import { forkJoin, Observable } from 'rxjs';
import {
  selectAuthState,
  selectCurrentUser,
} from '../../../ngrx/selectors/auth.selectors';
import {
  cleanupCredentials,
  logout,
  newAuthCredentials,
} from 'src/app/ngrx/actions/auth.actions';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { take } from 'rxjs/operators';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { Actions, ofType } from '@ngrx/effects';
import { reloadMenus } from '../../../ngrx/actions/core.actions';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { MenuItemPosition } from '../../../enums/menu-item-position';
import { MenuItemType } from '../../../enums/menu-item-type';
import { Crag } from '../../../models/crag';
import {
  selectInstagramUrl,
  selectInstanceName,
  selectLogoImage,
  selectYoutubeUrl,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { File } from '../../../models/file';
import { User } from '../../../models/user';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { SearchDialogComponent } from '../search-dialog/search-dialog.component';

@Component({
  selector: 'lc-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [DialogService],
})
export class MenuComponent implements OnInit {
  items: MenuItem[] = [];
  userMenuItems: MenuItem[] = [];
  isMobile$: Observable<boolean>;
  logoImage$: Observable<File>;
  instanceName$: Observable<string>;
  currentUser$: Observable<User>;
  ref: DynamicDialogRef | undefined;

  constructor(
    private menuItemsService: MenuItemsService,
    private translocoService: TranslocoService,
    private dialogService: DialogService,
    private actions: Actions,
    private store: Store,
  ) {}

  ngOnInit() {
    this.logoImage$ = this.store.pipe(select(selectLogoImage));
    this.instanceName$ = this.store.pipe(select(selectInstanceName));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.currentUser$ = this.store.pipe(select(selectCurrentUser));
    this.buildMenu();
    this.buildUserMenu();
    this.actions
      .pipe(ofType(reloadMenus, newAuthCredentials, cleanupCredentials))
      .subscribe((action) => {
        // Prevent loading menus if new credentials come from token refresh
        if (
          action.type === newAuthCredentials.type &&
          !action.initialCredentials
        ) {
          return;
        }
        this.buildMenu();
        this.buildUserMenu();
      });
  }

  buildUserMenu() {
    this.store
      .select(selectAuthState)
      .pipe(take(1))
      .subscribe((authState) => {
        if (authState.user) {
          this.userMenuItems = [
            {
              label: this.translocoService.translate(
                marker('menu.systemCategory'),
              ),
              visible: authState.user.moderator,
              items: [
                {
                  icon: 'pi pi-fw pi-file',
                  label: this.translocoService.translate(
                    marker('menu.menuPages'),
                  ),
                  routerLink: '/pages',
                },
                {
                  icon: 'pi pi-fw pi-bars',
                  label: this.translocoService.translate(marker('menu.menus')),
                  routerLink: '/menu-items',
                },
                {
                  icon: 'pi pi-fw pi-users',
                  label: this.translocoService.translate(marker('menu.users')),
                  routerLink: '/users',
                  visible: authState.user.moderator,
                },
                {
                  icon: 'pi pi-fw pi-cog',
                  label: this.translocoService.translate(
                    marker('menu.instanceSettings'),
                  ),
                  routerLink: '/instance-settings',
                },
              ],
            },
            {
              label: this.translocoService.translate(
                marker('menu.accountCategory'),
              ),
              items: [
                {
                  icon: 'pi pi-fw pi-user',
                  label: this.translocoService.translate(
                    marker('menu.accountDetail'),
                  ),
                  routerLink: `/users/${authState.user.slug}`,
                },
                {
                  icon: 'pi pi-fw pi-check-circle',
                  label: this.translocoService.translate(marker('menu.todos')),
                  routerLink: `/todos`,
                },
                {
                  icon: 'pi pi-fw pi-user-edit',
                  label: this.translocoService.translate(
                    marker('menu.account'),
                  ),
                  routerLink: '/account',
                },
                {
                  icon: 'pi pi-fw pi-shield',
                  label: this.translocoService.translate(
                    marker('menu.changePassword'),
                  ),
                  routerLink: '/change-password',
                },
                {
                  label: this.translocoService.translate(marker('menu.logout')),
                  icon: 'pi pi-fw pi-sign-out',
                  command: this.logout.bind(this),
                },
              ],
            },
          ];
        }
      });
  }

  buildMenu() {
    forkJoin([
      this.menuItemsService.getMenuItems(),
      this.menuItemsService.getCragMenuStructure(),
      this.store.select(selectYoutubeUrl).pipe(take(1)),
      this.store.select(selectInstagramUrl).pipe(take(1)),
    ]).subscribe(([menuItems, crags, youtubeUrl, instagramUrl]) => {
      this.items = [];
      const menuItemsTop = menuItems.filter(
        (menuItem) => menuItem.position === MenuItemPosition.TOP,
      );
      menuItemsTop.map((menuItem) => {
        switch (menuItem.type) {
          case MenuItemType.MENU_PAGE:
            this.items.push({
              label: menuItem.menuPage.title,
              icon: `pi pi-fw ${menuItem.icon}`,
              routerLink: '/pages/' + menuItem.menuPage.slug,
            });
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
              icon: 'pi pi-fw pi-instagram',
            });
            break;
          case MenuItemType.YOUTUBE:
            this.items.push({
              label: this.translocoService.translate(marker('menu.youtube')),
              url: youtubeUrl,
              icon: 'pi pi-fw pi-youtube',
            });
            break;
          case MenuItemType.TOPO:
            this.items.push({
              label: this.translocoService.translate(marker('menu.topo')),
              icon: 'pi pi-fw pi-map',
              routerLink: '/topo/crags',
              items: this.buildCragNavigationMenu(crags),
            });
            break;
          case MenuItemType.ASCENTS:
            this.items.push({
              label: this.translocoService.translate(marker('menu.ascents')),
              icon: 'pi pi-fw pi-check-square',
              routerLink: '/ascents',
            });
            break;
          case MenuItemType.RANKING:
            this.items.push({
              label: this.translocoService.translate(marker('menu.ranking')),
              icon: 'pi pi-fw pi-trophy',
              routerLink: '/ranking',
            });
            break;
          case MenuItemType.GALLERY:
            this.items.push({
              label: this.translocoService.translate(marker('menu.gallery')),
              icon: 'pi pi-fw pi-images',
              routerLink: '/topo/gallery',
            });
            break;
          case MenuItemType.HISTORY:
            this.items.push({
              label: this.translocoService.translate(marker('menu.history')),
              icon: 'pi pi-fw pi-clock',
              routerLink: '/history',
            });
            break;
        }
      });
    });
  }

  buildCragNavigationMenu(crags: Crag[]) {
    const cragItems = [];
    crags.map((crag) => {
      cragItems.push({
        label: crag.name,
        routerLink: `/topo/${crag.slug}/sectors`,
        items: crag.sectors.map((sector) => {
          return {
            label: sector.name,
            routerLink: `/topo/${crag.slug}/${sector.slug}/areas`,
            items: sector.areas.map((area) => {
              return {
                label: area.name,
                routerLink: `/topo/${crag.slug}/${sector.slug}/${area.slug}/topo-images`,
              };
            }),
          };
        }),
      });
    });
    return cragItems;
  }

  /**
   * Logs out the user.
   */
  logout() {
    this.store.dispatch(logout({ isAutoLogout: false, silent: false }));
  }

  openSearch() {
    this.ref = this.dialogService.open(SearchDialogComponent, {
      position: 'top',
      closeOnEscape: true,
      dismissableMask: true,
      modal: true,
      showHeader: false,
      styleClass: 'search-dialog',
    });
  }
}
