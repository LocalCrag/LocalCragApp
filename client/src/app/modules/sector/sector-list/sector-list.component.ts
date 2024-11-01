import { Component, OnInit } from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { TranslocoService } from '@jsverse/transloco';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';
import {ActivatedRoute, Router} from '@angular/router';
import { PrimeIcons, SelectItem } from 'primeng/api';
import { OrderItemsComponent } from '../../shared/components/order-items/order-items.component';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';

/**
 * Component that displays a list of sectors.
 */
@Component({
  selector: 'lc-sector-list',
  templateUrl: './sector-list.component.html',
  styleUrls: ['./sector-list.component.scss'],
  providers: [DialogService],
})
@UntilDestroy()
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

  constructor(
    public sectorsService: SectorsService,
    private route: ActivatedRoute,
    private dialogService: DialogService,
    private store: Store,
    private translocoService: TranslocoService,
    private router: Router,
  ) {}

  /**
   * Loads the sectors on initialization.
   */
  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(untilDestroyed(this))
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
      if (sectors.length > 0 && sectors[0].slug === "_default") {
        this.router.navigate(['topo', this.cragSlug, '_default', 'areas']);
        return;
      }
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
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshData();
    });
  }
}
