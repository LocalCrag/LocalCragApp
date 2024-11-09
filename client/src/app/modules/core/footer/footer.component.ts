import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { MenuItemPosition } from '../../../enums/menu-item-position';
import { MenuItemType } from '../../../enums/menu-item-type';
import { TranslocoService } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { reloadMenus } from '../../../ngrx/actions/core.actions';
import { forkJoin, Observable } from 'rxjs';
import {
  selectCopyrightOwner,
  selectInstagramUrl,
  selectYoutubeUrl,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';

@Component({
  selector: 'lc-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class FooterComponent implements OnInit {
  public currentYear = new Date().getFullYear();
  public menuItems: { title: string; routerLink: string; link: string }[] = [];
  public copyrightOwner$: Observable<string>;

  constructor(
    private menuItemsService: MenuItemsService,
    private store: Store,
    private actions: Actions,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit() {
    this.copyrightOwner$ = this.store.select(selectCopyrightOwner);
    this.buildMenu();
    this.actions.pipe(ofType(reloadMenus)).subscribe(() => {
      this.buildMenu();
    });
  }

  buildMenu() {
    this.menuItems = [];
    forkJoin([
      this.menuItemsService.getMenuItems(),
      this.store.select(selectYoutubeUrl).pipe(take(1)),
      this.store.select(selectInstagramUrl).pipe(take(1)),
    ]).subscribe(([menuItems, youtubeUrl, instagramUrl]) => {
      const menuItemsBottom = menuItems.filter(
        (menuItem) => menuItem.position === MenuItemPosition.BOTTOM,
      );
      menuItemsBottom.map((menuItem) => {
        switch (menuItem.type) {
          case MenuItemType.MENU_PAGE:
            this.menuItems.push({
              title: menuItem.menuPage.title,
              routerLink: '/pages/' + menuItem.menuPage.slug,
              link: null,
            });
            break;
          case MenuItemType.NEWS:
            this.menuItems.push({
              title: this.translocoService.translate('menu.news'),
              routerLink: '/news',
              link: null,
            });
            break;
          case MenuItemType.TOPO:
            this.menuItems.push({
              title: this.translocoService.translate('menu.topo'),
              routerLink: '/topo',
              link: null,
            });
            break;
          case MenuItemType.ASCENTS:
            this.menuItems.push({
              title: this.translocoService.translate('menu.ascents'),
              routerLink: '/ascents',
              link: null,
            });
            break;
          case MenuItemType.RANKING:
            this.menuItems.push({
              title: this.translocoService.translate('menu.ranking'),
              routerLink: '/ranking',
              link: null,
            });
            break;
          case MenuItemType.YOUTUBE:
            this.menuItems.push({
              title: this.translocoService.translate('menu.youtube'),
              routerLink: null,
              link: youtubeUrl,
            });
            break;
          case MenuItemType.INSTAGRAM:
            this.menuItems.push({
              title: this.translocoService.translate('menu.instagram'),
              routerLink: null,
              link: instagramUrl,
            });
            break;
          case MenuItemType.GALLERY:
            this.menuItems.push({
              title: this.translocoService.translate('menu.gallery'),
              routerLink: '/topo/gallery',
              link: null,
            });
            break;
        }
      });
    });
  }

  openLink(link: string) {
    window.open(link, '_blank');
  }
}
