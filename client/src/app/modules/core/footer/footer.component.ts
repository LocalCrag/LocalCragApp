import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {MenuItemsService} from '../../../services/crud/menu-items.service';
import {MenuItemPosition} from '../../../enums/menu-item-position';
import {MenuItemType} from '../../../enums/menu-item-type';
import {TranslocoService} from '@ngneat/transloco';
import {Store} from '@ngrx/store';
import {Actions, ofType} from '@ngrx/effects';
import {reloadMenus} from '../../../ngrx/actions/core.actions';

@Component({
  selector: 'lc-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FooterComponent implements OnInit{

  public currentYear = (new Date()).getFullYear();
  public menuItems: {title: string, routerLink: string, link: string}[] = [];

  constructor(private menuItemsService: MenuItemsService,
              private actions: Actions,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.buildMenu();
    this.actions.pipe(ofType(reloadMenus)).subscribe(() => {
      this.buildMenu();
    })
  }

  buildMenu(){
    this.menuItems = [];
    this.menuItemsService.getMenuItems().subscribe(menuItems => {
      const menuItemsBottom = menuItems.filter(menuItem => menuItem.position === MenuItemPosition.BOTTOM);
      menuItemsBottom.map(menuItem => {
        switch (menuItem.type){
          case MenuItemType.MENU_PAGE:
            this.menuItems.push({
              title: menuItem.menuPage.title,
              routerLink: 'pages/' + menuItem.menuPage.slug,
              link: null
            });
            break;
          case MenuItemType.NEWS:
            this.menuItems.push({
              title: this.translocoService.translate('menu.news'),
              routerLink: 'news',
              link: null
            });
            break;
          case MenuItemType.TOPO:
            this.menuItems.push({
              title: this.translocoService.translate('menu.topo'),
              routerLink: 'topo',
              link: null
            });
            break;
          case MenuItemType.YOUTUBE:
            this.menuItems.push({
              title: this.translocoService.translate('menu.youtube'),
              routerLink: null,
              link: 'https://www.youtube.com/channel/UCVcSFPVAiKbg3QLDNdXIl-Q',// todo
            });
            break;
          case MenuItemType.INSTAGRAM:
            this.menuItems.push({
              title: this.translocoService.translate('menu.instagram'),
              routerLink: null,
              link: 'https://www.instagram.com/gleesbouldering/', // todo
            });
            break;
        }
      })
    })
  }

  openLink(link: string){
    window.open(link, "_blank");
  }

}
