import {Component, OnInit} from '@angular/core';
import {Crag} from '../../../models/crag';
import {CragsService} from '../../../services/crud/crags.service';
import {LoadingState} from '../../../enums/loading-state';
import {SelectItem} from 'primeng/api';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {forkJoin, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {selectIsLoggedIn} from '../../../ngrx/selectors/auth.selectors';
import {filter, take} from 'rxjs/operators';
import {environment} from '../../../../environments/environment';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';

@Component({
  selector: 'lc-crag-list',
  templateUrl: './crag-list.component.html',
  styleUrls: ['./crag-list.component.scss']
})
export class CragListComponent implements OnInit {

  public crags: Crag[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isLoggedIn$: Observable<boolean>;
  public isMobile$: Observable<boolean>;

  constructor(private cragsService: CragsService,
              private store: Store,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    forkJoin([
      this.cragsService.getCrags(),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([crags, e]) => {
      this.crags = crags;
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
