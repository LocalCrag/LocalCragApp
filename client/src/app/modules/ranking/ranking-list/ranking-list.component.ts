import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { RankingService } from '../../../services/crud/ranking.service';
import { Ranking } from '../../../models/ranking';
import { LoadingState } from '../../../enums/loading-state';
import { LineType } from '../../../enums/line-type';
import { DataViewModule } from 'primeng/dataview';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { SelectItem, SharedModule } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AvatarModule } from 'primeng/avatar';
import { RouterLink } from '@angular/router';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';

@Component({
  selector: 'lc-ranking-list',
  imports: [
    DataViewModule,
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
    DialogModule,
    HasPermissionDirective,
    Select,
    ToggleSwitch,
  ],
  templateUrl: './ranking-list.component.html',
  styleUrl: './ranking-list.component.scss',
  encapsulation: ViewEncapsulation.None,
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
  public secretRankings = false;
  public showInfoPopup = false;

  constructor(
    private rankingService: RankingService,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit() {
    this.rankingTypes = [
      {
        label: this.translocoService.translate(marker('top10Ranking')),
        value: 'top10',
      },
      {
        label: this.translocoService.translate(marker('top50Ranking')),
        value: 'top50',
      },
      {
        label: this.translocoService.translate(marker('totalCountRanking')),
        value: 'totalCount',
      },
    ];
    this.rankingType = this.rankingTypes[0];
    this.loadRanking();
  }

  loadRanking() {
    this.loading = LoadingState.LOADING;
    let query_params = `?line_type=${LineType.BOULDER}`;
    if (this.cragId) {
      query_params += `&crag_id=${this.cragId}`;
    }
    if (this.sectorId) {
      query_params += `&sector_id=${this.sectorId}`;
    }
    if (this.secretRankings) {
      query_params += `&secret=1`;
    }
    this.rankingService.getRanking(query_params).subscribe((rankings) => {
      this.rankings = rankings;
      this.sortField = this.rankingType.value;
      this.rankings.sort((a, b) =>
        a[this.sortField] < b[this.sortField]
          ? 1
          : a[this.sortField] > b[this.sortField]
            ? -1
            : 0,
      );
      this.loading = LoadingState.DEFAULT;
    });
  }

  showDialog() {
    this.showInfoPopup = true;
  }
}
