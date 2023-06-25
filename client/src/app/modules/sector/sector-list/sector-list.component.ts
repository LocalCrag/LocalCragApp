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

/**
 * Component that displays a list of sectors.
 */
@Component({
  selector: 'lc-sector-list',
  templateUrl: './sector-list.component.html',
  styleUrls: ['./sector-list.component.scss']
})
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

  constructor(private sectorsService: SectorsService,
              private route: ActivatedRoute,
              private store: Store,
              private translocoService: TranslocoService) {
  }

  /**
   * Loads the sectors on initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    console.log(this.cragSlug);
    forkJoin([
      this.sectorsService.getSectors(this.cragSlug),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([sectors, e]) => {
      this.sectors = sectors;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {label: this.translocoService.translate(marker('sortAZ')), value: '!name'},
        {label: this.translocoService.translate(marker('sortZA')), value: 'name'}
      ];
      this.sortKey = this.sortOptions[0];
    });
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
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
}
