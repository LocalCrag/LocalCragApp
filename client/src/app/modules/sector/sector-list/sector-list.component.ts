import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ConfirmationService, PrimeIcons, SelectItem } from 'primeng/api';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';

import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { DataView } from 'primeng/dataview';
import { Select } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { Button } from 'primeng/button';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Component that displays a list of sectors.
 */
@Component({
  selector: 'lc-sector-list',
  templateUrl: './sector-list.component.html',
  styleUrls: ['./sector-list.component.scss'],
  providers: [DialogService, ConfirmationService],
  imports: [
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
    TranslocoDirective,
    Message,
    LeveledGradeDistributionComponent,
    SanitizeHtmlPipe,
    ClosedSpotAlertComponent,
  ],
})
export class SectorListComponent implements OnInit {
  public sectors: Sector[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public ref: DynamicDialogRef | undefined;
  public sectorsService = inject(SectorsService);

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private dialogService = inject(DialogService);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);

  /**
   * Loads the sectors on initialization.
   */
  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cragSlug =
          this.route.parent.parent.snapshot.paramMap.get('crag-slug');
        this.refreshData();
      });
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([
      this.sectorsService.getSectors(this.cragSlug),
      this.translocoService.load(`${environment.language}`),
    ]).subscribe(([sectors]) => {
      this.sectors = sectors;
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
   * Opens the reordering dialog for the sectors.
   */
  reorderSectors() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      modal: true,
      header: this.translocoService.translate(
        marker('reorderSectorsDialogTitle'),
      ),
      data: {
        items: this.sectors,
        itemsName: this.translocoService.translate(
          marker('reorderSectorsDialogItemsName'),
        ),
        callback: this.sectorsService.updateSectorOrder.bind(
          this.sectorsService,
        ),
        slugParameter: this.cragSlug,
      },
    });
    this.ref.onClose.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.refreshData();
    });
  }
}
