import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { GradeDistributionBarChartComponent } from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { forkJoin, Observable, of } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '../../../services/crud/users.service';
import { User } from '../../../models/user';
import { CompletionComponent } from '../completion/completion.component';
import { AscentsPerYearChartComponent } from '../ascents-per-year-chart/ascents-per-year-chart.component';
import { GradeDistribution } from '../../../models/scale';
import { SkeletonModule } from 'primeng/skeleton';
import {
  HardestGradeBucket,
  UserStatistics,
} from '../../../models/user-statistics';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { LineType } from '../../../enums/line-type';
import { selectBarChartColor } from '../../../ngrx/selectors/instance-settings.selectors';

@Component({
  selector: 'lc-user-charts',
  imports: [
    AsyncPipe,
    GradeDistributionBarChartComponent,
    AscentsPerYearChartComponent,
    TranslocoDirective,
    SkeletonModule,
    CompletionComponent,
  ],
  templateUrl: './user-charts.component.html',
  styleUrl: './user-charts.component.scss',
})
export class UserChartsComponent implements OnInit {
  public user: User;
  public fetchUserGrades: Observable<GradeDistribution>;
  public fetchUserFlashGrades: Observable<GradeDistribution>;
  public stats: UserStatistics | null = null;
  public hardestAscentLabel$: Observable<string> = of('');
  public hardestFlashLabel$: Observable<string> = of('');
  public hardestFaLabel$: Observable<string> = of('');
  public barChartColor: string | null = null;
  public lineTypes = [LineType.BOULDER, LineType.SPORT, LineType.TRAD];

  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);
  private transloco = inject(TranslocoService);
  private scalesService = inject(ScalesService);
  private translateSpecialGrades = inject(TranslateSpecialGradesService);
  private store = inject(Store);

  ngOnInit() {
    const userSlug =
      this.route.snapshot.parent.parent.paramMap.get('user-slug');
    this.usersService.getUser(userSlug).subscribe((user) => {
      this.user = user;
    });
    const grades$ = this.usersService
      .getUserGrades(userSlug)
      .pipe(shareReplay(1));
    this.fetchUserGrades = grades$.pipe(map((g) => g.distribution));
    this.fetchUserFlashGrades = grades$.pipe(map((g) => g.flashDistribution));

    forkJoin({
      stats: this.usersService.getUserStatistics(userSlug),
      barChartColor: this.store.select(selectBarChartColor).pipe(take(1)),
    }).subscribe(({ stats, barChartColor }) => {
      this.stats = stats;
      this.hardestAscentLabel$ = this.formatHardestLine(
        stats.ascentTotals.hardestAscentGrades,
      );
      this.hardestFlashLabel$ = this.formatHardestLine(
        stats.ascentTotals.hardestFlashGrades,
      );
      this.hardestFaLabel$ = this.formatHardestLine(
        stats.ascentTotals.hardestFaGrades,
      );
      this.barChartColor = barChartColor;
    });
  }

  /**
   * Resolves hardest-grade buckets to a human-readable label string.
   *
   * Each bucket is converted from `(lineType, gradeScale, gradeValue)` to a
   * translated grade name using `ScalesService` and `TranslateSpecialGradesService`.
   * Multiple buckets (e.g. different scales/line types) are joined with ` · `.
   *
   * @returns Observable emitting `''` when no buckets exist, otherwise joined labels.
   */
  private formatHardestLine(buckets: HardestGradeBucket[]): Observable<string> {
    if (!buckets.length) {
      return of('').pipe(shareReplay(1));
    }
    return forkJoin(
      buckets.map((b) =>
        this.scalesService
          .gradeNameByValue(b.lineType, b.gradeScale, b.gradeValue)
          .pipe(map((n) => this.translateSpecialGrades.translate(n || ''))),
      ),
    ).pipe(
      map((names) => names.filter((s) => s.trim()).join(' · ')),
      shareReplay(1),
    );
  }

  lineTypeLabel(lt: LineType): string {
    return this.transloco.translate(lt);
  }

  hasRankingTiles(stats: UserStatistics): boolean {
    return this.lineTypes.some(
      (lt) =>
        stats.globalRankByLineType[lt] != null ||
        stats.globalRankTop50ByLineType[lt] != null ||
        stats.globalRankTotalCountByLineType[lt] != null,
    );
  }

  shouldShowModerationTiles(): boolean {
    return !!this.user?.moderator;
  }
}
