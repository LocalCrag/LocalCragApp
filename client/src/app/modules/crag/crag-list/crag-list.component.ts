import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Crag } from '../../../models/crag';
import { CragsService } from '../../../services/crud/crags.service';
import { LoadingState } from '../../../enums/loading-state';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import {
  buildTopoListOrderDirectionOptions,
  buildTopoListOrderOptions,
  topoListSortFieldAndOrder,
  TopoListSortSelectOption,
} from '../../../utility/topo-list-sort';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
 * Component that lists all crags in an area.
 */
@Component({
  selector: 'lc-crag-list',
  templateUrl: './crag-list.component.html',
  styleUrls: ['./crag-list.component.scss'],
  providers: [provideIcons({ lucideArrowUpDown, lucideInfo, lucidePlus })],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    TranslocoDirective,
    FormsModule,
    RouterLink,
    HasPermissionDirective,
    TopoDataviewSkeletonComponent,
    NgClass,
    ArchiveButtonComponent,
    AscentCountComponent,
    ClosedSpotTagComponent,
    SecretSpotTagComponent,
    LeveledGradeDistributionComponent,
    SanitizeHtmlPipe,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    NgIcon,
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
  public ref: BrnDialogRef | undefined;
  public cragsService = inject(CragsService);

  private destroyRef = inject(DestroyRef);
  private store = inject(Store);
  private dialogService = inject(HlmDialogService);
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
      title: this.translocoService.translate(marker('reorderCragsDialogTitle')),
      contentClass: 'sm:max-w-lg',
      context: {
        items: [...this.crags].sort(
          (left, right) => (left.orderIndex ?? 0) - (right.orderIndex ?? 0),
        ),
        itemsName: this.translocoService.translate(
          marker('reorderCragsDialogItemsName'),
        ),
        callback: this.cragsService.updateCragOrder.bind(this.cragsService),
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
    if (!this.crags) {
      return;
    }
    this.crags = [...this.crags].sort((left, right) => {
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
