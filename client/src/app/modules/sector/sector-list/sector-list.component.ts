import {Component} from '@angular/core';
import {Crag} from '../../../models/crag';
import {LoadingState} from '../../../enums/loading-state';
import {forkJoin, Observable} from 'rxjs';
import {CragsService} from '../../../services/crud/crags.service';
import {select, Store} from '@ngrx/store';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {Sector} from '../../../models/sector';
import {SectorsService} from '../../../services/crud/sectors.service';
import {ActivatedRoute} from '@angular/router';
import {SelectItem} from 'primeng/api';
import {OrderItemsComponent} from '../../shared/components/order-items/order-items.component';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';

/**
 * Component that displays a list of sectors.
 */
@Component({
  selector: 'lc-sector-list',
  templateUrl: './sector-list.component.html',
  styleUrls: ['./sector-list.component.scss'],
  providers: [
    DialogService
  ]
})
@UntilDestroy()
export class SectorListComponent {

  public sectors: Sector[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isLoggedIn$: Observable<boolean>;
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public ref: DynamicDialogRef | undefined;

  constructor(private sectorsService: SectorsService,
              private route: ActivatedRoute,
              private dialogService: DialogService,
              private store: Store,
              private translocoService: TranslocoService) {
  }

  /**
   * Loads the sectors on initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
    this.refreshData();
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  /**
   * Loads new data.
   */
  refreshData(){
    forkJoin([
      this.sectorsService.getSectors(this.cragSlug),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([sectors, e]) => {
      this.sectors = sectors;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {label: this.translocoService.translate(marker('sortAscending')), value: '!orderIndex'},
        {label: this.translocoService.translate(marker('sortDescending')), value: 'orderIndex'},
        {label: this.translocoService.translate(marker('sortAZ')), value: '!name'},
        {label: this.translocoService.translate(marker('sortZA')), value: 'name'}
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
   * Opens the reordering dialog for the sectors.
   */
  reorderSectors() {
    this.ref = this.dialogService.open(OrderItemsComponent, {
      header: this.translocoService.translate(marker('reorderSectorsDialogTitle')),
      data: {
        items: this.sectors,
        itemsName: this.translocoService.translate(marker('reorderSectorsDialogItemsName')),
        callback: this.sectorsService.updateSectorOrder.bind(this.sectorsService),
        slugParameter: this.cragSlug
      }
    });
    this.ref.onClose.pipe(untilDestroyed(this)).subscribe(() => {
      this.refreshData();
    });
  }

}
