import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { RankingService } from '../../../services/crud/ranking.service';
import { Ranking } from '../../../models/ranking';
import { LoadingState } from '../../../enums/loading-state';
import { LineType } from '../../../enums/line-type';
import { DataViewModule } from 'primeng/dataview';
import { AsyncPipe, NgClass } from '@angular/common';
import { SelectItem } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { RouterLink } from '@angular/router';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Select } from 'primeng/select';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { RankingListSkeletonComponent } from '../ranking-list-skeleton/ranking-list-skeleton.component';
import { Message } from 'primeng/message';
import { CragsService } from '../../../services/crud/crags.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { GradeDistribution } from '../../../models/scale';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Store } from '@ngrx/store';
import { selectRankingPastWeeks } from '../../../ngrx/selectors/instance-settings.selectors';
import { Observable } from 'rxjs';
import { ApiQueryParams } from '../../../utility/http/query-params';

@Component({
  selector: 'lc-ranking-list',
  imports: [
    DataViewModule,
    TranslocoDirective,
    NgClass,
    ButtonModule,
    ConfirmPopupModule,
    UserAvatarComponent,
    RouterLink,
    FormsModule,
    DialogModule,
    HasPermissionDirective,
    Select,
    ToggleSwitch,
    RankingListSkeletonComponent,
    Message,
    AsyncPipe,
  ],
  templateUrl: './ranking-list.component.html',
  styleUrl: './ranking-list.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class RankingListComponent implements OnInit {
  @Input() crag: Crag;
  @Input() sector: Sector;

  public loadingStates = LoadingState;
  public rankings: Ranking[];
  public loading: LoadingState = LoadingState.DEFAULT;
  public sortField: string;
  public rankField: 'rankTop10' | 'rankTop50' | 'rankTotalCount' = 'rankTop10';
  public sortOrder = -1;
  public rankingTypes: SelectItem[];
  public rankingType: SelectItem;
  public secretRankings = false;
  public showInfoPopup = false;
  public lineTypes: SelectItem<LineType>[] = null;
  public lineType: SelectItem<LineType> = null;
  public rankingPastWeeks: Observable<number | null>;

  private rankingService = inject(RankingService);
  private translocoService = inject(TranslocoService);
  private cragsService = inject(CragsService);
  private sectorsService = inject(SectorsService);
  private store = inject(Store);

  private static readonly RANK_FIELD_BY_SORT: Record<
    string,
    'rankTop10' | 'rankTop50' | 'rankTotalCount'
  > = {
    top10: 'rankTop10',
    top50: 'rankTop50',
    totalCount: 'rankTotalCount',
  };

  ngOnInit() {
    this.rankingTypes = [
      {
        label: this.translocoService.translate(marker('ranking.topN'), {
          count: 10,
        }),
        value: 'top10',
      },
      {
        label: this.translocoService.translate(marker('ranking.topN'), {
          count: 50,
        }),
        value: 'top50',
      },
      {
        label: this.translocoService.translate(marker('totalCountRanking')),
        value: 'totalCount',
      },
    ];
    this.rankingType = this.rankingTypes[0];
    this.rankingPastWeeks = this.store.select(selectRankingPastWeeks);

    this.loading = LoadingState.LOADING;
    if (this.crag) {
      this.cragsService
        .getCragGrades(this.crag.slug)
        .subscribe((gradeDistribution) => {
          this.interpretGradeDistribution(gradeDistribution);
          this.loadRanking();
        });
    } else if (this.sector) {
      this.sectorsService
        .getSectorGrades(this.sector.slug)
        .subscribe((gradeDistribution) => {
          this.interpretGradeDistribution(gradeDistribution);
          this.loadRanking();
        });
    } else {
      this.lineType = {
        label: this.translocoService.translate(LineType.BOULDER),
        value: LineType.BOULDER,
      };
      this.lineTypes = [this.lineType];
      this.loadRanking();
    }
  }

  interpretGradeDistribution(gradeDistribution: GradeDistribution) {
    const lineTypes: typeof this.lineTypes = [];
    const typeCounts = {
      BOULDER: 0,
      SPORT: 0,
      TRAD: 0,
    };
    for (const lineType in gradeDistribution) {
      for (const scale in gradeDistribution[lineType]) {
        for (const count of Object.values(gradeDistribution[lineType][scale])) {
          typeCounts[lineType] += count;
        }
      }
    }
    Object.entries(typeCounts)
      .filter(([, count]) => count > 0)
      .sort(([, c1], [, c2]) => c2 - c1)
      .forEach(([lineType]) => {
        lineTypes.push({
          label: this.translocoService.translate(lineType),
          value: lineType as LineType,
        });
      });
    this.lineType = lineTypes[0] ?? null;
    this.lineTypes = lineTypes;
  }

  loadRanking() {
    if (!this.lineType) {
      // There will be no line type if there is no line yet in an instance
      this.loading = LoadingState.DEFAULT;
      return;
    }
    this.loading = LoadingState.LOADING;
    const params: ApiQueryParams = {
      line_type: this.lineType.value.toString(),
    };
    if (this.crag) {
      params.crag_id = this.crag.id;
    }
    if (this.sector) {
      params.sector_id = this.sector.id;
    }
    if (this.secretRankings) {
      params.secret = '1';
    }
    this.rankingService.getRanking(params).subscribe((rankings) => {
      this.rankings = rankings;
      this.applyRankingTypeSort();
      this.loading = LoadingState.DEFAULT;
    });
  }

  onRankingTypeChange() {
    this.applyRankingTypeSort();
  }

  applyRankingTypeSort() {
    this.sortField = this.rankingType.value;
    this.rankField =
      RankingListComponent.RANK_FIELD_BY_SORT[this.sortField] ?? 'rankTop10';
    if (!this.rankings?.length) {
      return;
    }
    this.rankings.sort((a, b) =>
      a[this.sortField] < b[this.sortField]
        ? 1
        : a[this.sortField] > b[this.sortField]
          ? -1
          : 0,
    );
  }

  showDialog() {
    this.showInfoPopup = true;
  }
}
