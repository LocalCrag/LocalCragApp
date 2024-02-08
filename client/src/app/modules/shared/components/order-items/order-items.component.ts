import {Component} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {AbstractModel} from '../../../../models/abstract-model';
import {LoadingState} from '../../../../enums/loading-state';
import {Observable} from 'rxjs';

/**
 * A component that shows an order list to order items by orderIndex.
 * This component is designed to be spawned in an NG Prime dynamic dialog.
 */
@Component({
  selector: 'lc-order-items',
  templateUrl: './order-items.component.html',
  styleUrls: ['./order-items.component.scss']
})
export class OrderItemsComponent {

  public items: AbstractModel[];
  public itemsName: string;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;
  public showImage = false;
  public showLinePathLineName = false;

  private callback: (payload: any, slug?: string) => Observable<any>;
  private slugParameter: string;

  constructor(private dialogConfig: DynamicDialogConfig,
              private ref: DynamicDialogRef) {
    this.items = this.dialogConfig.data.items;
    this.itemsName = this.dialogConfig.data.itemsName;
    this.callback = this.dialogConfig.data.callback;
    this.slugParameter = this.dialogConfig.data.slugParameter;
    this.showImage = this.dialogConfig.data.showImage ? this.dialogConfig.data.showImage : false;
    this.showLinePathLineName = this.dialogConfig.data.showLinePathLineName ? this.dialogConfig.data.showLinePathLineName : false;
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
      newOrder[item.id] = index;
    });
    let callback = this.callback(newOrder);
    if(this.slugParameter){
      callback = this.callback(newOrder, this.slugParameter)
    }
    callback.subscribe(() => {
      this.loadingState = LoadingState.DEFAULT;
      this.ref.close();
    });
  }

}
