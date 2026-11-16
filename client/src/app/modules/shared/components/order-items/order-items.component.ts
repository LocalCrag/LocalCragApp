import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { AbstractModel } from '../../../../models/abstract-model';
import { LoadingState } from '../../../../enums/loading-state';
import { ItemOrder } from '../../../../interfaces/item-order.interface';
import { Observable } from 'rxjs';
import { MenuItemType } from '../../../../enums/menu-item-type';
import { Store } from '@ngrx/store';
import { selectIsMobile } from '../../../../ngrx/selectors/device.selectors';
import { ScalesService } from '../../../../services/crud/scales.service';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { AsyncPipe } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronUp,
  lucideGripVertical,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { LineGradePipe } from '../../pipes/line-grade.pipe';

interface OrderItemsDialogContext {
  items: AbstractModel[];
  itemsName: string;
  callback: (payload: ItemOrder, slug?: string) => Observable<any>;
  slugParameter?: string;
  showImage?: boolean;
  showLinePathLineName?: boolean;
  showMenuItemTitle?: boolean;
  idAccessor?: (item: AbstractModel) => string;
}

/**
 * A component that shows an order list to order items by orderIndex.
 * This component is designed to be spawned in a dialog.
 */
@Component({
  selector: 'lc-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    DragDropModule,
    TranslocoDirective,
    AsyncPipe,
    TranslocoPipe,
    NgIcon,
    HlmButton,
    HlmSpinner,
    LineGradePipe,
  ],
  providers: [
    provideIcons({ lucideChevronDown, lucideChevronUp, lucideGripVertical }),
  ],
})
export class OrderItemsComponent {
  /** Heterogeneous models (areas, lines, menu items, images) share this list. */
  public items: any[];
  public itemsName: string;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public showImage = false;
  public showLinePathLineName = false;
  public showMenuItemTitle = false;
  public menuItemTypes = MenuItemType;
  public isMobile$: Observable<boolean>;

  readonly callback: (payload: ItemOrder, slug?: string) => Observable<any>;
  readonly idAccessor = (item: AbstractModel) => item.id; // Sometimes we have to get the id from a deeper property
  readonly slugParameter: string;

  private dialogContext = injectBrnDialogContext<OrderItemsDialogContext>();
  private store = inject(Store);
  private ref = inject(BrnDialogRef);

  protected scalesService = inject(ScalesService);

  constructor() {
    this.items = [...this.dialogContext.items];
    this.itemsName = this.dialogContext.itemsName;
    this.callback = this.dialogContext.callback;
    this.slugParameter = this.dialogContext.slugParameter;
    this.showImage = this.dialogContext.showImage
      ? this.dialogContext.showImage
      : false;
    this.showLinePathLineName = this.dialogContext.showLinePathLineName
      ? this.dialogContext.showLinePathLineName
      : false;
    this.showMenuItemTitle = this.dialogContext.showMenuItemTitle
      ? this.dialogContext.showMenuItemTitle
      : false;
    this.idAccessor = this.dialogContext.idAccessor
      ? this.dialogContext.idAccessor
      : this.idAccessor;
    this.isMobile$ = this.store.select(selectIsMobile);
  }

  drop(event: CdkDragDrop<AbstractModel[]>): void {
    moveItemInArray(this.items, event.previousIndex, event.currentIndex);
  }

  moveItem(from: number, to: number): void {
    if (to < 0 || to >= this.items.length) {
      return;
    }
    moveItemInArray(this.items, from, to);
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
    const newOrder: ItemOrder = {};
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
