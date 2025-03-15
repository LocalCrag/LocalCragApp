import { Component } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AbstractModel } from '../../../../models/abstract-model';
import { LoadingState } from '../../../../enums/loading-state';
import { Observable } from 'rxjs';
import { MenuItemType } from '../../../../enums/menu-item-type';
import { Store } from '@ngrx/store';
import { selectIsMobile } from '../../../../ngrx/selectors/device.selectors';
import { ScalesService } from '../../../../services/crud/scales.service';
import { OrderList } from 'primeng/orderlist';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { AsyncPipe, NgIf } from '@angular/common';
import { SharedModule } from '../../shared.module';
import { Button } from 'primeng/button';

/**
 * A component that shows an order list to order items by orderIndex.
 * This component is designed to be spawned in an NG Prime dynamic dialog.
 */
@Component({
  selector: 'lc-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.scss'],
  standalone: true,
  imports: [
    OrderList,
    TranslocoDirective,
    AsyncPipe,
    SharedModule,
    TranslocoPipe,
    Button,
    NgIf,
  ],
})
export class OrderItemsComponent {
  public items: AbstractModel[];
  public itemsName: string;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public showImage = false;
  public showLinePathLineName = false;
  public showMenuItemTitle = false;
  public menuItemTypes = MenuItemType;
  public isMobile$: Observable<boolean>;

  readonly callback: (payload: any, slug?: string) => Observable<any>;
  readonly idAccessor = (item: AbstractModel) => item.id; // Sometimes we have to get the id from a deeper property
  readonly slugParameter: string;

  constructor(
    private dialogConfig: DynamicDialogConfig,
    private store: Store,
    private ref: DynamicDialogRef,
    protected scalesService: ScalesService,
  ) {
    this.items = [...this.dialogConfig.data.items];
    this.itemsName = this.dialogConfig.data.itemsName;
    this.callback = this.dialogConfig.data.callback;
    this.slugParameter = this.dialogConfig.data.slugParameter;
    this.showImage = this.dialogConfig.data.showImage
      ? this.dialogConfig.data.showImage
      : false;
    this.showLinePathLineName = this.dialogConfig.data.showLinePathLineName
      ? this.dialogConfig.data.showLinePathLineName
      : false;
    this.showMenuItemTitle = this.dialogConfig.data.showMenuItemTitle
      ? this.dialogConfig.data.showMenuItemTitle
      : false;
    this.idAccessor = this.dialogConfig.data.idAccessor
      ? this.dialogConfig.data.idAccessor
      : this.idAccessor;
    this.isMobile$ = this.store.select(selectIsMobile);
  }

  /**
   * Closes the dialog.
   */
  cancel() {
    this.ref.close();
  }

  /**
   * Saves the items by calling the callback function with an order dictionary, then closes the dialog.
   */
  saveItems() {
    this.loadingState = LoadingState.LOADING;
    const newOrder = {};
    this.items.forEach((item, index) => {
      newOrder[this.idAccessor(item)] = index;
    });
    let callback = this.callback(newOrder);
    if (this.slugParameter) {
      callback = this.callback(newOrder, this.slugParameter);
    }
    callback.subscribe(() => {
      this.loadingState = LoadingState.DEFAULT;
      this.ref.close();
    });
  }
}
