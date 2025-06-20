import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { RankingService } from '../../../services/crud/ranking.service';
import { Ranking } from '../../../models/ranking';
import { LoadingState } from '../../../enums/loading-state';
import { LineType } from '../../../enums/line-type';
import { DataViewModule } from 'primeng/dataview';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import { SelectItem } from 'primeng/api';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { AvatarModule } from 'primeng/avatar';
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

@Component({
  selector: 'lc-ranking-list',
  imports: [
    DataViewModule,
    NgForOf,
    NgIf,
    TranslocoDirective,
    NgClass,
    ButtonModule,
    ConfirmPopupModule,
    AvatarModule,
    RouterLink,
    FormsModule,
    DialogModule,
    HasPermissionDirective,
    Select,
    ToggleSwitch,
    RankingListSkeletonComponent,
    Message,
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
  public sortOrder = -1;
  public rankingTypes: SelectItem[];
  public rankingType: SelectItem;
  public secretRankings = false;
  public showInfoPopup = false;
  public lineTypes: SelectItem<LineType>[] = null;
  public lineType: SelectItem<LineType> = null;

  constructor(
    private rankingService: RankingService,
    private translocoService: TranslocoService,
    private cragsService: CragsService,
    private sectorsService: SectorsService,
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
    this.loading = LoadingState.LOADING;
    const query_params = new URLSearchParams({
      line_type: this.lineType.value.toString(),
    });
    if (this.crag) {
      query_params.set('crag_id', this.crag.id);
    }
    if (this.sector) {
      query_params.set('sector_id', this.sector.id);
    }
    if (this.secretRankings) {
      query_params.set('secret', '1');
    }
    this.rankingService
      .getRanking(`?${query_params.toString()}`)
      .subscribe((rankings) => {
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
