import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Crag } from '../../../models/crag';
import { CragsService } from '../../../services/crud/crags.service';
import { LoadingState } from '../../../enums/loading-state';
import { ConfirmationService } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import {
  buildTopoListOrderDirectionOptions,
  buildTopoListOrderOptions,
  topoListSortFieldAndOrder,
  TopoListSortSelectOption,
} from '../../../utility/topo-list-sort';

import { DataView } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { TopoDataviewSkeletonComponent } from '../../shared/components/topo-dataview-skeleton/topo-dataview-skeleton.component';
import { NgClass } from '@angular/common';
import { ArchiveButtonComponent } from '../../archive/archive-button/archive-button.component';
import { AscentCountComponent } from '../../ascent/ascent-count/ascent-count.component';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { Message } from 'primeng/message';
import { LeveledGradeDistributionComponent } from '../../shared/components/leveled-grade-distribution/leveled-grade-distribution.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { ClosedSpotAlertComponent } from '../../shared/components/closed-spot-alert/closed-spot-alert.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component that lists all crags in an area.
 */
@Component({
  selector: 'lc-crag-list',
  templateUrl: './crag-list.component.html',
  styleUrls: ['./crag-list.component.scss'],
  providers: [DialogService, ConfirmationService],
  imports: [
    TranslocoDirective,
    DataView,
    Select,
    FormsModule,
    Button,
    RouterLink,
    HasPermissionDirective,
    TopoDataviewSkeletonComponent,
    NgClass,
    ArchiveButtonComponent,
    AscentCountComponent,
    ClosedSpotTagComponent,
    SecretSpotTagComponent,
    Message,
    LeveledGradeDistributionComponent,
    SanitizeHtmlPipe,
    ClosedSpotAlertComponent,
  ],
})
export class CragListComponent implements OnInit {
  public crags: Crag[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public orderOptions: TopoListSortSelectOption[];
  public orderKey: TopoListSortSelectOption;
  public orderDirectionOptions: TopoListSortSelectOption[];
  public orderDirectionKey: TopoListSortSelectOption;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public ref: DynamicDialogRef | undefined;
  public cragsService = inject(CragsService);

  private destroyRef = inject(DestroyRef);
  private store = inject(Store);
  private dialogService = inject(DialogService);
  private translocoService = inject(TranslocoService);

  /**
   * Loads the crags on initialization.
   */
  ngOnInit() {
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([this.cragsService.getCrags()]).subscribe(([crags]) => {
      this.crags = crags;
      this.loading = LoadingState.DEFAULT;
      this.initSortControls();
    });
  }

  onSortControlsChange() {
    this.applySort();
  }

  /**
   * Opens the reordering dialog for the crags.
   */
  reorderCrags() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      modal: true,
      header: this.translocoService.translate(
        marker('reorderCragsDialogTitle'),
      ),
      data: {
        items: this.crags,
        itemsName: this.translocoService.translate(
          marker('reorderCragsDialogItemsName'),
        ),
        callback: this.cragsService.updateCragOrder.bind(this.cragsService),
      },
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshData();
    });
  }

  private initSortControls() {
    this.orderOptions = buildTopoListOrderOptions(this.translocoService);
    this.orderDirectionOptions = buildTopoListOrderDirectionOptions(
      this.translocoService,
    );
    this.orderKey = this.orderOptions[0];
    this.orderDirectionKey = this.orderDirectionOptions[1];
    this.applySort();
  }

  private applySort() {
    if (!this.orderKey || !this.orderDirectionKey) {
      return;
    }
    const { sortField, sortOrder } = topoListSortFieldAndOrder(
      this.orderKey,
      this.orderDirectionKey,
    );
    this.sortField = sortField;
    this.sortOrder = sortOrder;
  }
}
