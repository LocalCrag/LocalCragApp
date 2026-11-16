import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import {
  buildTopoListOrderDirectionOptions,
  buildTopoListOrderOptions,
  topoListSortFieldAndOrder,
  TopoListSortSelectOption,
} from '../../../utility/topo-list-sort';
import { FormsModule } from '@angular/forms';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { TopoDataviewSkeletonComponent } from '../../shared/components/topo-dataview-skeleton/topo-dataview-skeleton.component';
import { NgClass } from '@angular/common';
import { ArchiveButtonComponent } from '../../archive/archive-button/archive-button.component';
import { AscentCountComponent } from '../../ascent/ascent-count/ascent-count.component';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { LeveledGradeDistributionComponent } from '../../shared/components/leveled-grade-distribution/leveled-grade-distribution.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowUpDown, lucideInfo, lucidePlus } from '@ng-icons/lucide';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';

/**
 * Component that displays a list of sectors.
 */
@Component({
  selector: 'lc-sector-list',
  templateUrl: './sector-list.component.html',
  styleUrls: ['./sector-list.component.scss'],
  providers: [provideIcons({ lucideArrowUpDown, lucideInfo, lucidePlus })],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    FormsModule,
    RouterLink,
    HasPermissionDirective,
    TopoDataviewSkeletonComponent,
    NgClass,
    ArchiveButtonComponent,
    AscentCountComponent,
    ClosedSpotTagComponent,
    SecretSpotTagComponent,
    TranslocoDirective,
    LeveledGradeDistributionComponent,
    SanitizeHtmlPipe,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    NgIcon,
  ],
})
export class SectorListComponent implements OnInit {
  public sectors: Sector[];
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
  public ref: BrnDialogRef | undefined;
  public sectorsService = inject(SectorsService);

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private dialogService = inject(HlmDialogService);
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
    forkJoin([this.sectorsService.getSectors(this.cragSlug)]).subscribe(
      ([sectors]) => {
        this.sectors = sectors;
        this.loading = LoadingState.DEFAULT;
        this.initSortControls();
      },
    );
  }

  onSortControlsChange() {
    this.applySort();
  }

  /**
   * Opens the reordering dialog for the sectors.
   */
  reorderSectors() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      title: this.translocoService.translate(
        marker('reorderSectorsDialogTitle'),
      ),
      contentClass: 'sm:max-w-lg',
      context: {
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
    this.ref.closed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
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
    if (!this.sectors) {
      return;
    }
    this.sectors = [...this.sectors].sort((left, right) => {
      const leftValue = left[sortField as keyof typeof left];
      const rightValue = right[sortField as keyof typeof right];
      const result =
        typeof leftValue === 'string' || typeof rightValue === 'string'
          ? String(leftValue ?? '').localeCompare(String(rightValue ?? ''))
          : (Number(leftValue) || 0) - (Number(rightValue) || 0);
      return result * sortOrder;
    });
  }
}
