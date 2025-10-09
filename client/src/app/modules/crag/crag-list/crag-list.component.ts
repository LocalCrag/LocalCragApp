import { Component, OnInit } from '@angular/core';
import { Crag } from '../../../models/crag';
import { CragsService } from '../../../services/crud/crags.service';
import { LoadingState } from '../../../enums/loading-state';
import { ConfirmationService, PrimeIcons, SelectItem } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { environment } from '../../../../environments/environment';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataView } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { TopoDataviewSkeletonComponent } from '../../shared/components/topo-dataview-skeleton/topo-dataview-skeleton.component';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { ArchiveButtonComponent } from '../../archive/archive-button/archive-button.component';
import { AscentCountComponent } from '../../ascent/ascent-count/ascent-count.component';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { Message } from 'primeng/message';
import { LeveledGradeDistributionComponent } from '../../shared/components/leveled-grade-distribution/leveled-grade-distribution.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { ClosedSpotAlertComponent } from '../../shared/components/closed-spot-alert/closed-spot-alert.component';

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
    NgIf,
    NgForOf,
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
@UntilDestroy()
export class CragListComponent implements OnInit {
  public crags: Crag[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public ref: DynamicDialogRef | undefined;

  constructor(
    public cragsService: CragsService,
    private store: Store,
    private dialogService: DialogService,
    private translocoService: TranslocoService,
  ) {}

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
    forkJoin([
      this.cragsService.getCrags(),
      this.translocoService.load(`${environment.language}`),
    ]).subscribe(([crags]) => {
      this.crags = crags;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {
          icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT,
          label: this.translocoService.translate(marker('sortAscending')),
          value: '!orderIndex',
        },
        {
          icon: PrimeIcons.SORT_AMOUNT_DOWN,
          label: this.translocoService.translate(marker('sortDescending')),
          value: 'orderIndex',
        },
        {
          icon: PrimeIcons.SORT_ALPHA_DOWN,
          label: this.translocoService.translate(marker('sortAZ')),
          value: '!name',
        },
        {
          icon: 'pi pi-sort-alpha-down-alt',
          label: this.translocoService.translate(marker('sortZA')),
          value: 'name',
        },
      ];
      this.sortKey = this.sortOptions[0];
    });
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    const value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
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
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshData();
    });
  }
}
