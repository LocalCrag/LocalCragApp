import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {RankingService} from '../../../services/crud/ranking.service';
import {Ranking} from '../../../models/ranking';
import {LoadingState} from '../../../enums/loading-state';
import {LineType} from '../../../enums/line-type';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {SelectItem, SharedModule} from 'primeng/api';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {ButtonModule} from 'primeng/button';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {AvatarModule} from 'primeng/avatar';
import {RouterLink} from '@angular/router';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {FormsModule} from '@angular/forms';
import {DialogModule} from 'primeng/dialog';

@Component({
  selector: 'lc-ranking-list',
  standalone: true,
  imports: [
    DataViewModule,
    DropdownModule,
    NgForOf,
    NgIf,
    SharedModule,
    TranslocoDirective,
    NgClass,
    ButtonModule,
    ConfirmPopupModule,
    InfiniteScrollModule,
    AvatarModule,
    RouterLink,
    FormsModule,
    DialogModule
  ],
  templateUrl: './ranking-list.component.html',
  styleUrl: './ranking-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class RankingListComponent implements OnInit {

  @Input() cragId: string;
  @Input() sectorId: string;

  public loadingStates = LoadingState;
  public rankings: Ranking[];
  public loading: LoadingState = LoadingState.DEFAULT;
  public sortField: string;
  public sortOrder = -1;
  public rankingTypes: SelectItem[];
  public rankingType: SelectItem;
  public showInfoPopup = false;

  constructor(private rankingService: RankingService,
              private translocoService: TranslocoService) {
  }


  ngOnInit() {
    this.rankingTypes = [
      {
        label: this.translocoService.translate(marker('top10Ranking')),
        value: 'top10'
      },
      {
        label: this.translocoService.translate(marker('top25Ranking')),
        value: 'top25'
      },
      {
        label: this.translocoService.translate(marker('top10FaRanking')),
        value: 'top10Fa'
      },
      {
        label: this.translocoService.translate(marker('totalCountRanking')),
        value: 'totalCount'
      },
      {
        label: this.translocoService.translate(marker('totalFaCountRanking')),
        value: 'totalFaCount'
      },
      {
        label: this.translocoService.translate(marker('top10ExponentialRanking')),
        value: 'top10Exponential'
      },
      {
        label: this.translocoService.translate(marker('top25ExponentialRanking')),
        value: 'top25Exponential'
      },
      {
        label: this.translocoService.translate(marker('top10FaExponentialRanking')),
        value: 'top10FaExponential'
      },
      {
        label: this.translocoService.translate(marker('totalRanking')),
        value: 'total'
      },
      {
        label: this.translocoService.translate(marker('totalFaRanking')),
        value: 'totalFa'
      },
      {
        label: this.translocoService.translate(marker('totalExponentialRanking')),
        value: 'totalExponential'
      },
      {
        label: this.translocoService.translate(marker('totalFaExponentialRanking')),
        value: 'totalFaExponential'
      },
    ];
    this.rankingType = this.rankingTypes[0];
    this.loadRanking();
  }

  loadRanking() {
    this.loading = LoadingState.LOADING;
    let filters = `?line_type=${LineType.BOULDER}`;
    if (this.cragId) {
      filters += `&crag_id=${this.cragId}`;
    }
    if (this.sectorId) {
      filters += `&sector_id=${this.sectorId}`;
    }
    this.rankingService.getRanking(filters).subscribe(rankings => {
      this.rankings = rankings;
      this.sortField = this.rankingType.value;
      this.rankings.sort((a, b) => a[this.sortField] < b[this.sortField] ? 1 : a[this.sortField] > b[this.sortField] ? -1 : 0)
      this.loading = LoadingState.DEFAULT;
    })
  }

  showDialog() {
    this.showInfoPopup = true;
  }

}
