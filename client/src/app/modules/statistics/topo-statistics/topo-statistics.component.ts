import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { combineLatest, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';
import { Message } from 'primeng/message';
import { ProgressBar } from 'primeng/progressbar';
import { Skeleton } from 'primeng/skeleton';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

import { ObjectType } from '../../../models/object';
import { Line } from '../../../models/line';
import { GradeDistribution } from '../../../models/scale';
import { TopoStatLine, TopoStatistics } from '../../../models/topo-statistics';
import { TopoStatisticsService } from '../../../services/crud/topo-statistics.service';
import { RegionService } from '../../../services/crud/region.service';
import { CragsService } from '../../../services/crud/crags.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { AreasService } from '../../../services/crud/areas.service';
import { ScalesService } from '../../../services/crud/scales.service';
import { ThemeService } from '../../../services/core/theme.service';
import {
  selectBarChartColor,
  selectDarkBarChartColor,
} from '../../../ngrx/selectors/instance-settings.selectors';
import {
  getChartThemeColors,
  resolveBarChartColor,
  resolveCssColorVar,
  toRgba,
} from '../../../utility/chart-theme';
import {
  buildWeekHeatmap,
  HEATMAP_WEEKDAYS,
  HeatmapCell,
  heatmapMax,
} from '../../../utility/topo-statistics-heatmap';
import { AscentsPerYearChartComponent } from '../../user/ascents-per-year-chart/ascents-per-year-chart.component';
import { GradeDistributionBarChartComponent } from '../../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';

Chart.register(ChartDataLabels);

interface PaintedHeatCell extends HeatmapCell {
  color: string;
  label: string;
}

interface PaintedHeatRow {
  weekday: number;
  label: string;
  cells: PaintedHeatCell[];
}

const PIE_COLOR_VARS = [
  '--p-blue-500',
  '--p-orange-500',
  '--p-teal-500',
  '--p-purple-500',
  '--p-green-500',
  '--p-red-500',
  '--p-yellow-500',
  '--p-pink-500',
  '--p-cyan-500',
  '--p-indigo-500',
  '--p-lime-500',
  '--p-amber-500',
];

@Component({
  selector: 'lc-topo-statistics',
  imports: [
    TranslocoDirective,
    RouterLink,
    ChartModule,
    Message,
    ProgressBar,
    Skeleton,
    AscentsPerYearChartComponent,
    GradeDistributionBarChartComponent,
    LineGradePipe,
  ],
  templateUrl: './topo-statistics.component.html',
  styleUrl: './topo-statistics.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopoStatisticsComponent implements OnInit {
  public stats: TopoStatistics | null = null;
  public loading = true;
  public failed = false;
  public objectType: ObjectType = ObjectType.Region;
  public gradeDistribution$: Observable<GradeDistribution> | null = null;
  public heatmap: PaintedHeatRow[] = [];
  public heatMax = 0;
  public legendSwatches: string[] = [];
  public barColor: string | null = null;
  public weekHeaders = Array.from({ length: 53 }, (_, index) => index + 1);
  public ratingChartData: any;
  public ratingChartOptions: any;
  public disciplineChartData: any;
  public disciplineChartOptions: any;
  public childrenChartData: any;
  public childrenChartOptions: any;
  public voteChartData: any;
  public voteChartOptions: any;
  public ascentsYearLabel = '';
  public ascentsYearEmpty = '';
  public faYearLabel = '';
  public faYearEmpty = '';

  private slug: string | null = null;
  private gradeLines = new WeakMap<object, Line>();
  private cdr = inject(ChangeDetectorRef);
  private gradeNames: Record<number, string> = {};
  private voteLoadToken = 0;
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private store = inject(Store);
  private transloco = inject(TranslocoService);
  private themeService = inject(ThemeService);
  private statisticsService = inject(TopoStatisticsService);
  private regionService = inject(RegionService);
  private cragsService = inject(CragsService);
  private sectorsService = inject(SectorsService);
  private areasService = inject(AreasService);
  private scalesService = inject(ScalesService);

  constructor() {
    combineLatest([
      this.store.select(selectBarChartColor),
      this.store.select(selectDarkBarChartColor),
      toObservable(this.themeService.isDarkMode),
      this.transloco.langChanges$,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([color, darkColor, isDark]) => {
        this.barColor = resolveBarChartColor(color, darkColor, isDark);
        this.buildCharts();
        this.cdr.markForCheck();
      });
  }

  ngOnInit(): void {
    this.route.data
      .pipe(
        switchMap((data) => {
          this.objectType = data['objectType'] ?? ObjectType.Region;
          this.loading = true;
          this.failed = false;
          this.stats = null;
          this.cdr.markForCheck();
          if (this.objectType === ObjectType.Region) {
            this.gradeDistribution$ = this.regionService.getRegionGrades();
            return this.statisticsService.get('region');
          }
          return this.route.parent.parent.paramMap.pipe(
            switchMap((params) => {
              this.slug = this.readSlug(params);
              this.gradeDistribution$ = this.gradesForScope();
              return this.statisticsService.get(
                this.objectType.toLowerCase(),
                this.slug,
              );
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.loading = false;
          this.buildCharts();
          this.loadVoteNames();
          this.cdr.markForCheck();
        },
        error: () => {
          this.loading = false;
          this.failed = true;
          this.cdr.markForCheck();
        },
      });
  }

  get isLine(): boolean {
    return this.objectType === ObjectType.Line;
  }

  get showDisciplines(): boolean {
    const counts = this.stats?.disciplines;
    if (!counts) {
      return false;
    }
    return Object.values(counts).filter((count) => count > 0).length > 1;
  }

  get showChildren(): boolean {
    return (this.stats?.children?.length ?? 0) > 1;
  }

  get completionPercent(): number {
    const completion = this.stats?.myCompletion;
    if (!completion?.total) {
      return 0;
    }
    return Math.round((completion.ascended / completion.total) * 100);
  }

  private weekdayLabel(weekday: number): string {
    const lang = this.transloco.getActiveLang().split('-')[0];
    // 1 January 2024 is a Monday, so ISO weekday 1..7 maps onto that week.
    return new Date(2024, 0, weekday).toLocaleString(lang, {
      weekday: 'short',
    });
  }

  private cellColor(count: number): string {
    if (!count || !this.heatMax) {
      return 'var(--p-content-border-color)';
    }
    const level = Math.max(1, Math.ceil((count / this.heatMax) * 4));
    const alpha = 0.25 * level;
    return toRgba(this.barColor || 'rgb(239, 68, 68)', alpha);
  }

  private legendColor(level: number): string {
    if (!this.heatMax) {
      return this.cellColor(0);
    }
    return this.cellColor(Math.ceil((this.heatMax * level) / 4));
  }

  /**
   * Stable line object for the grade pipe. A new object on every check makes
   * that impure pipe drop its subscription and start another.
   */
  gradeLine(source: TopoStatLine | TopoStatistics['gradeVotes']): Line {
    const cached = this.gradeLines.get(source);
    if (cached) {
      return cached;
    }
    const line = {
      type: source.lineType,
      gradeScale: source.gradeScale,
      authorGradeValue: source.authorGradeValue,
      userGradeValue: source.userGradeValue,
    } as Line;
    this.gradeLines.set(source, line);
    return line;
  }

  private cellLabel(week: number, weekday: string, count: number): string {
    return this.transloco.translate('topoStatistics.heatmapCell', {
      week,
      weekday,
      count,
    });
  }

  childHeadingKey(): string {
    switch (this.stats?.childKind) {
      case 'sector':
        return 'topoStatistics.childrenSectors';
      case 'area':
        return 'topoStatistics.childrenAreas';
      default:
        return 'topoStatistics.childrenCrags';
    }
  }

  private readSlug(params: { get(name: string): string | null }): string {
    switch (this.objectType) {
      case ObjectType.Crag:
        return params.get('crag-slug');
      case ObjectType.Sector:
        return params.get('sector-slug');
      case ObjectType.Area:
        return params.get('area-slug');
      case ObjectType.Line:
        return params.get('line-slug');
      default:
        return null;
    }
  }

  private gradesForScope(): Observable<GradeDistribution> | null {
    switch (this.objectType) {
      case ObjectType.Crag:
        return this.cragsService.getCragGrades(this.slug);
      case ObjectType.Sector:
        return this.sectorsService.getSectorGrades(this.slug);
      case ObjectType.Area:
        return this.areasService.getAreaGrades(this.slug);
      default:
        return null;
    }
  }

  private loadVoteNames(): void {
    const votes = this.stats?.gradeVotes;
    const token = ++this.voteLoadToken;
    if (!votes || !Object.keys(votes.votes).length) {
      this.gradeNames = {};
      this.voteChartData = null;
      return;
    }
    this.scalesService
      .gradeNameByValueMap(votes.lineType, votes.gradeScale)
      .pipe(take(1))
      .subscribe((names) => {
        if (token !== this.voteLoadToken) {
          return;
        }
        this.gradeNames = names ?? {};
        this.buildVoteChart();
        this.cdr.markForCheck();
      });
  }

  private buildCharts(): void {
    this.ascentsYearLabel = this.transloco.translate(
      'topoStatistics.ascentsPerYear',
    );
    this.ascentsYearEmpty = this.transloco.translate(
      'topoStatistics.noAscentYearData',
    );
    this.faYearLabel = this.transloco.translate(
      'topoStatistics.firstAscentsPerYear',
    );
    this.faYearEmpty = this.transloco.translate(
      'topoStatistics.noFirstAscentYearData',
    );
    if (!this.stats) {
      return;
    }
    this.paintHeatmap();
    this.buildRatingChart();
    this.buildDisciplineChart();
    this.buildChildrenChart();
    this.buildVoteChart();
  }

  private paintHeatmap(): void {
    const rows = buildWeekHeatmap(this.stats?.heatmap);
    this.heatMax = heatmapMax(rows);
    const weekdayLabels = new Map(
      HEATMAP_WEEKDAYS.map((weekday) => [weekday, this.weekdayLabel(weekday)]),
    );
    this.heatmap = rows.map((row) => {
      const weekdayName = weekdayLabels.get(row.weekday) ?? '';
      return {
        weekday: row.weekday,
        label: weekdayName,
        cells: row.cells.map((cell) => ({
          ...cell,
          color: this.cellColor(cell.count),
          label: this.cellLabel(cell.week, weekdayName, cell.count),
        })),
      };
    });
    this.legendSwatches = [1, 2, 3, 4].map((level) => this.legendColor(level));
  }

  private buildRatingChart(): void {
    const distribution = this.stats?.ratings.distribution ?? {};
    const labels = ['1', '2', '3', '4', '5'];
    this.ratingChartData = {
      labels: labels.map((star) =>
        this.transloco.translate('topoStatistics.stars', { count: star }),
      ),
      datasets: [
        {
          data: labels.map((star) => distribution[star] ?? 0),
          backgroundColor: this.barColor,
          borderWidth: 0,
        },
      ],
    };
    this.ratingChartOptions = this.barOptions();
  }

  private buildDisciplineChart(): void {
    if (!this.showDisciplines || !this.stats?.disciplines) {
      this.disciplineChartData = null;
      return;
    }
    const slices = Object.entries(this.stats.disciplines)
      .filter(([, count]) => count > 0)
      .map(([type, count]) => ({
        label: this.transloco.translate(type),
        value: count,
      }));
    const pie = this.toPie(slices);
    this.disciplineChartData = pie.data;
    this.disciplineChartOptions = this.pieOptions();
  }

  private buildChildrenChart(): void {
    if (!this.showChildren || !this.stats?.children) {
      this.childrenChartData = null;
      return;
    }
    const pie = this.toPie(
      this.stats.children.map((child) => ({
        label: child.name,
        value: child.lineCount,
      })),
    );
    this.childrenChartData = pie.data;
    this.childrenChartOptions = this.pieOptions();
  }

  private buildVoteChart(): void {
    const votes = this.stats?.gradeVotes?.votes;
    if (!votes || !Object.keys(votes).length) {
      this.voteChartData = null;
      return;
    }
    const values = Object.keys(votes)
      .map((value) => Number(value))
      .sort((left, right) => left - right);
    this.voteChartData = {
      labels: values.map((value) => this.gradeNames[value] || String(value)),
      datasets: [
        {
          data: values.map((value) => votes[String(value)] ?? 0),
          backgroundColor: this.barColor,
          borderWidth: 0,
        },
      ],
    };
    this.voteChartOptions = this.barOptions();
  }

  private toPie(items: { label: string; value: number }[]): { data: any } {
    const sorted = items
      .filter((item) => item.value > 0)
      .sort((left, right) => right.value - left.value);
    const head = sorted.slice(0, 12);
    const rest = sorted.slice(12).reduce((sum, item) => sum + item.value, 0);
    if (rest > 0) {
      head.push({
        label: this.transloco.translate('topoStatistics.other'),
        value: rest,
      });
    }
    const { textColor } = getChartThemeColors();
    return {
      data: {
        labels: head.map((item) => `${item.label} (${item.value})`),
        datasets: [
          {
            data: head.map((item) => item.value),
            backgroundColor: head.map((_, index) =>
              index < PIE_COLOR_VARS.length
                ? resolveCssColorVar(PIE_COLOR_VARS[index], this.barColor)
                : textColor,
            ),
            borderWidth: 0,
          },
        ],
      },
    };
  }

  private barOptions(): any {
    const { textColor, gridColor } = getChartThemeColors();
    return {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 18 } },
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'end',
          color: textColor,
          display: (ctx: {
            dataset: { data: unknown[] };
            dataIndex: number;
          }) => {
            const value = ctx.dataset.data[ctx.dataIndex];
            return typeof value === 'number' && value > 0;
          },
          formatter: (value: unknown) =>
            typeof value === 'number' && value > 0 ? String(value) : '',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: textColor, precision: 0 },
          grid: { color: gridColor },
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false },
        },
      },
    };
  }

  private pieOptions(): any {
    const { textColor } = getChartThemeColors();
    return {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor },
        },
        datalabels: {
          color: textColor,
          // Small slices sit next to each other, so their numbers overlap.
          // Those counts stay readable in the legend instead.
          display: (ctx: {
            dataset: { data: unknown[] };
            dataIndex: number;
          }) => {
            const values = ctx.dataset.data.map((value) =>
              typeof value === 'number' ? value : 0,
            );
            const total = values.reduce((sum, value) => sum + value, 0);
            const value = values[ctx.dataIndex] ?? 0;
            return total > 0 && value / total >= 0.05;
          },
          formatter: (value: unknown) =>
            typeof value === 'number' && value > 0 ? String(value) : '',
        },
      },
    };
  }
}
