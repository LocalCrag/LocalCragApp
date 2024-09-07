import {Component, OnInit} from '@angular/core';
import {LoadingState} from '../../../enums/loading-state';
import {forkJoin, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {Title} from '@angular/platform-browser';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@jsverse/transloco';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {marker} from '@jsverse/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';
import {MenuItem} from '../../../models/menu-item';
import {MenuItemsService} from '../../../services/crud/menu-items.service';
import {MenuItemPosition} from '../../../enums/menu-item-position';
import {CardModule} from 'primeng/card';
import {DataViewModule} from 'primeng/dataview';
import {ButtonModule} from 'primeng/button';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {RouterLink} from '@angular/router';
import {MenuItemType} from '../../../enums/menu-item-type';
import {OrderItemsComponent} from '../../shared/components/order-items/order-items.component';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {reloadMenus} from '../../../ngrx/actions/core.actions';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {HasPermissionDirective} from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'lc-menu-items-list',
  standalone: true,
  imports: [
    CardModule,
    DataViewModule,
    ButtonModule,
    AsyncPipe,
    NgClass,
    RouterLink,
    TranslocoDirective,
    NgIf,
    NgForOf,
    TranslocoPipe,
    HasPermissionDirective
  ],
  templateUrl: './menu-items-list.component.html',
  styleUrl: './menu-items-list.component.scss',
  providers: [
    DialogService
  ]
})
@UntilDestroy()
export class MenuItemsListComponent implements OnInit {

  public menuItemsTop: MenuItem[];
  public menuItemsBottom: MenuItem[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public isMobile$: Observable<boolean>;
  public menuItemTypes = MenuItemType;
  public ref: DynamicDialogRef | undefined;
  public positions = MenuItemPosition;

  constructor(private menuItemsService: MenuItemsService,
              private dialogService: DialogService,
              private store: Store,
              private title: Title,
              private translocoService: TranslocoService) {
  }

  /**
   * Loads the menu items on initialization.
   */
  ngOnInit() {
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe(instanceName => {
      this.title.setTitle(`${this.translocoService.translate(marker('menuItemsListBrowserTitle'))} - ${instanceName}`);
    });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([
      this.menuItemsService.getMenuItems(),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([menuItems, e]) => {
      this.menuItemsTop = menuItems.filter(menuItem => menuItem.position === MenuItemPosition.TOP);
      this.menuItemsBottom = menuItems.filter(menuItem => menuItem.position === MenuItemPosition.BOTTOM);
      this.loading = LoadingState.DEFAULT;
    });
  }

  reorderMenuItems(position: MenuItemPosition) {
    let data: any;
    if (position === MenuItemPosition.TOP) {
      data = {
        items: this.menuItemsTop,
        itemsName: this.translocoService.translate(marker('reorderMenuItemsTopDialogItemsName')),
        callback: this.menuItemsService.updateMenuItemOrderTop.bind(this.menuItemsService),
        showMenuItemTitle: true,
      }
    }
    if (position === MenuItemPosition.BOTTOM) {
      data = {
        items: this.menuItemsBottom,
        itemsName: this.translocoService.translate(marker('reorderMenuItemsBottomDialogItemsName')),
        callback: this.menuItemsService.updateMenuItemOrderBottom.bind(this.menuItemsService),
        showMenuItemTitle: true,
      }
    }
    this.ref = this.dialogService.open(OrderItemsComponent, {
      header: this.translocoService.translate(marker('reorderMenuItemsDialogTitle')),
      data
    });
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshData();
      this.store.dispatch(reloadMenus());
    });
  }

}
