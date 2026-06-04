import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { ConfirmationService } from 'primeng/api';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { Area } from '../../../models/area';
import { AreasService } from '../../../services/crud/areas.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { NgClass } from '@angular/common';
import { TopoDataviewSkeletonComponent } from '../../shared/components/topo-dataview-skeleton/topo-dataview-skeleton.component';
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
 * Component that lists all areas in a sector.
 */
@Component({
  selector: 'lc-area-list',
  templateUrl: './area-list.component.html',
  styleUrls: ['./area-list.component.scss'],
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
export class AreaListComponent implements OnInit {
  public areasService = inject(AreasService);

  public areas: Area[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public orderOptions: TopoListSortSelectOption[];
  public orderKey: TopoListSortSelectOption;
  public orderDirectionOptions: TopoListSortSelectOption[];
  public orderDirectionKey: TopoListSortSelectOption;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public sectorSlug: string;
  public ref: DynamicDialogRef | undefined;

  private destroyRef = inject(DestroyRef);
  private store = inject(Store);
  private dialogService = inject(DialogService);
  private route = inject(ActivatedRoute);
  private translocoService = inject(TranslocoService);

  /**
   * Loads the areas on initialization.
   */
  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cragSlug =
          this.route.parent.parent.snapshot.paramMap.get('crag-slug');
        this.sectorSlug =
          this.route.parent.parent.snapshot.paramMap.get('sector-slug');
        this.refreshData();
      });
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([this.areasService.getAreas(this.sectorSlug)]).subscribe(
      ([areas]) => {
        this.areas = areas;
        this.loading = LoadingState.DEFAULT;
        this.initSortControls();
      },
    );
  }

  onSortControlsChange() {
    this.applySort();
  }

  /**
   * Opens the reordering dialog for the areas.
   */
  reorderAreas() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      modal: true,
      header: this.translocoService.translate(
        marker('reorderAreasDialogTitle'),
      ),
      data: {
        items: this.areas,
        itemsName: this.translocoService.translate(
          marker('reorderAreasDialogItemsName'),
        ),
        callback: this.areasService.updateAreaOrder.bind(this.areasService),
        slugParameter: this.sectorSlug,
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
