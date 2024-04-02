import {Component, OnInit} from '@angular/core';
import {Crag} from '../../../models/crag';
import {LoadingState} from '../../../enums/loading-state';
import {PrimeIcons, SelectItem} from 'primeng/api';
import {forkJoin, Observable} from 'rxjs';
import {CragsService} from '../../../services/crud/crags.service';
import {select, Store} from '@ngrx/store';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {Area} from '../../../models/area';
import {AreasService} from '../../../services/crud/areas.service';
import {ActivatedRoute} from '@angular/router';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {OrderItemsComponent} from '../../shared/components/order-items/order-items.component';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';

/**
 * Component that lists all areas in a sector.
 */
@Component({
  selector: 'lc-area-list',
  templateUrl: './area-list.component.html',
  styleUrls: ['./area-list.component.scss'],
  providers: [
    DialogService
  ]
})
@UntilDestroy()
export class AreaListComponent implements OnInit{

  public areas: Area[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public sectorSlug: string;
  public ref: DynamicDialogRef | undefined;

  constructor(public areasService: AreasService,
              private store: Store,
              private dialogService: DialogService,
              private route: ActivatedRoute,
              private translocoService: TranslocoService) {
  }

  /**
   * Loads the areas on initialization.
   */
  ngOnInit() {
    this.route.parent.parent.paramMap.pipe(untilDestroyed(this)).subscribe(params => {
      this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
      this.sectorSlug = this.route.parent.parent.snapshot.paramMap.get('sector-slug');
      this.refreshData();
    });
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  /**
   * Loads new data.
   */
  refreshData(){
    forkJoin([
      this.areasService.getAreas(this.sectorSlug),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([areas, e]) => {
      this.areas = areas;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT, label: this.translocoService.translate(marker('sortAscending')), value: '!orderIndex'},
        {icon: PrimeIcons.SORT_AMOUNT_DOWN, label: this.translocoService.translate(marker('sortDescending')), value: 'orderIndex'},
        {icon: PrimeIcons.SORT_ALPHA_DOWN, label: this.translocoService.translate(marker('sortAZ')), value: '!name'},
        {icon: 'pi pi-sort-alpha-down-alt', label: this.translocoService.translate(marker('sortZA')), value: 'name'}
      ];
      this.sortKey = this.sortOptions[0];
    });
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    let value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

  /**
   * Opens the reordering dialog for the areas.
   */
  reorderAreas() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      header: this.translocoService.translate(marker('reorderAreasDialogTitle')),
      data: {
        items: this.areas,
        itemsName: this.translocoService.translate(marker('reorderAreasDialogItemsName')),
        callback: this.areasService.updateAreaOrder.bind(this.areasService),
        slugParameter: this.sectorSlug
      }
    });
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshData();
    });
  }

}
