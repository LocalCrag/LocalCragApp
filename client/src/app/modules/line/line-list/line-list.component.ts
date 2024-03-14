import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {LoadingState} from '../../../enums/loading-state';
import {PrimeIcons, SelectItem} from 'primeng/api';
import {forkJoin, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {ActivatedRoute} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {Line} from '../../../models/line';
import {LinesService} from '../../../services/crud/lines.service';

/**
 * Component that lists all lines in an area.
 */
@Component({
  selector: 'lc-line-list',
  templateUrl: './line-list.component.html',
  styleUrls: ['./line-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LineListComponent implements OnInit {

  public lines: Line[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isLoggedIn$: Observable<boolean>;
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public sectorSlug: string;
  public areaSlug: string;

  constructor(private linesService: LinesService,
              private store: Store,
              private route: ActivatedRoute,
              private translocoService: TranslocoService) {
  }

  /**
   * Loads the lines on initialization.
   */
  ngOnInit() {
    this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.parent.parent.snapshot.paramMap.get('area-slug');
    forkJoin([
      this.linesService.getLines(this.areaSlug),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([lines, e]) => {
      this.lines = lines;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT, label: this.translocoService.translate(marker('sortByBlockAscending')), value: '!blockOrderIndex'},
        {icon: PrimeIcons.SORT_AMOUNT_DOWN, label: this.translocoService.translate(marker('sortByBlockDescending')), value: 'blockOrderIndex'},
        {icon: PrimeIcons.SORT_ALPHA_DOWN, label: this.translocoService.translate(marker('sortAZ')), value: '!name'},
        {icon: 'pi pi-sort-alpha-down-alt', label: this.translocoService.translate(marker('sortZA')), value: 'name'}
      ];
      this.sortKey = this.sortOptions[0];
    });
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn));
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
  }

  openVideo(event: MouseEvent, line: Line){
    event.preventDefault();
    event.stopPropagation();
    if(line.videos.length > 0){
      window.open(line.videos[0].url);
    }
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
