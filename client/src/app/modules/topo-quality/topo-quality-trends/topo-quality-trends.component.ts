import { Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { ChartModule } from 'primeng/chart';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { Skeleton } from 'primeng/skeleton';
import { SelectButton } from 'primeng/selectbutton';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { forkJoin, of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import {
  TopoPointsHistory,
  TopoQualityHistory,
} from '../../../models/topo-quality';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { ThemeService } from '../../../services/core/theme.service';
import { TopoQualityService } from '../../../services/crud/topo-quality.service';
import {
  getChartThemeColors,
  resolveCssColorVar,
} from '../../../utility/chart-theme';

type TrendRange = '3m' | '1y' | '5y' | 'all';

const SERIES_COLORS = [
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
  selector: 'lc-topo-quality-trends',
  imports: [
    TranslocoDirective,
    FormsModule,
    ChartModule,
    Message,
    Select,
    Skeleton,
    SelectButton,
    ToggleSwitch,
  ],
  templateUrl: './topo-quality-trends.component.html',
  styleUrl: './topo-quality-trends.component.scss',
})
export class TopoQualityTrendsComponent implements OnInit {
  private topoQualityService = inject(TopoQualityService);
  private store = inject(Store);
  private transloco = inject(TranslocoService);
  private theme = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  loading = true;
  failed = false;
  gameEnabled = false;
  cumulative = false;
  range: TrendRange = 'all';
  rangeOptions: { value: TrendRange; label: string }[] = [];
  scopeKey = 'region';
  scopes: { key: string; name: string }[] = [];
  qualityData: unknown = null;
  qualityOptions: unknown = null;
  pointsData: unknown = null;
  pointsOptions: unknown = null;
  pointsEmpty = true;
  pointsFilteredOut = false;
  qualityEmpty = false;

  private quality: TopoQualityHistory | null = null;
  private points: TopoPointsHistory | null = null;

  constructor() {
    effect(() => {
      this.theme.isDarkMode();
      this.paint();
    });
  }

  ngOnInit() {
    this.store
      .select(selectInstanceSettingsState)
      .pipe(
        filter((settings) => settings.loaded),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((settings) => {
        this.gameEnabled = settings.moderatorGameEnabled;
        this.load();
      });
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.paint());
  }

  private load() {
    forkJoin({
      quality: this.topoQualityService.history(),
      points: this.gameEnabled
        ? this.topoQualityService.pointsHistory()
        : of({ weeks: [], series: [] }),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ quality, points }) => {
          this.quality = quality;
          this.points = points;
          this.scopes = quality.scopes ?? [];
          if (!this.scopes.some((scope) => scope.key === this.scopeKey)) {
            this.scopeKey = this.scopes[0]?.key ?? 'region';
          }
          this.loading = false;
          this.paint();
        },
        error: () => {
          this.loading = false;
          this.failed = true;
        },
      });
  }

  paint() {
    this.refreshRangeOptions();
    if (!this.quality) {
      return;
    }
    const theme = getChartThemeColors();
    const accent = resolveCssColorVar('--p-primary-color', 'rgb(213, 30, 38)');
    const weeks = this.quality.weeks ?? [];
    const indexes = this.keptIndexes(weeks);
    const values = indexes.map(
      (index) => (this.quality?.series?.[this.scopeKey] ?? [])[index] ?? null,
    );
    this.qualityEmpty = indexes.length === 0;
    this.qualityData = this.qualityEmpty
      ? null
      : {
          labels: indexes.map((index) => this.weekLabel(weeks[index])),
          datasets: [
            {
              label: this.transloco.translate(
                marker('topoQuality.ui.qualityHistory'),
              ),
              data: values,
              borderColor: accent,
              backgroundColor: accent,
              tension: 0.2,
              spanGaps: false,
            },
          ],
        };
    this.qualityOptions = this.lineOptions(theme, 100);
    this.paintPoints(theme);
  }

  private paintPoints(theme: ReturnType<typeof getChartThemeColors>) {
    const history = this.points;
    const weeks = history?.weeks ?? [];
    const indexes = this.keptIndexes(weeks);
    const datasets = (history?.series ?? []).flatMap((row, index) => {
      const points = indexes.map((weekIndex) => row.points[weekIndex] ?? 0);
      if (points.every((value) => value === 0)) {
        return [];
      }
      const color = resolveCssColorVar(
        SERIES_COLORS[index % SERIES_COLORS.length],
        'rgb(59, 130, 246)',
      );
      return [
        {
          label: row.user.fullname,
          data: this.cumulative ? this.accumulate(points) : points,
          borderColor: color,
          backgroundColor: color,
          tension: 0.2,
        },
      ];
    });
    this.pointsFilteredOut = weeks.length > 0 && datasets.length === 0;
    this.pointsEmpty = datasets.length === 0;
    if (this.pointsEmpty) {
      this.pointsData = null;
      return;
    }
    this.pointsData = {
      labels: indexes.map((index) => this.weekLabel(weeks[index])),
      datasets,
    };
    this.pointsOptions = this.lineOptions(theme, undefined);
  }

  private keptIndexes(weeks: string[]): number[] {
    if (this.range === 'all') {
      return weeks.map((_, index) => index);
    }
    const cutoff = this.rangeStart(this.range);
    return weeks.reduce<number[]>((indexes, week, index) => {
      const start = this.weekDate(week);
      if (!start) {
        return indexes;
      }
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      if (end >= cutoff) {
        indexes.push(index);
      }
      return indexes;
    }, []);
  }

  private refreshRangeOptions() {
    const oldest = this.oldestWeek();
    const presets: { value: Exclude<TrendRange, 'all'>; label: string }[] = [
      {
        value: '3m',
        label: this.transloco.translate(marker('topoQuality.ui.range3Months')),
      },
      {
        value: '1y',
        label: this.transloco.translate(marker('topoQuality.ui.range1Year')),
      },
      {
        value: '5y',
        label: this.transloco.translate(marker('topoQuality.ui.range5Years')),
      },
    ];
    const filled = presets.filter((option) =>
      this.rangeIsFilled(option.value, oldest),
    );
    this.rangeOptions =
      filled.length === 0
        ? []
        : [
            ...filled,
            {
              value: 'all',
              label: this.transloco.translate(
                marker('topoQuality.ui.rangeAll'),
              ),
            },
          ];
    if (!this.rangeOptions.some((option) => option.value === this.range)) {
      this.range = 'all';
    }
  }

  private oldestWeek(): Date | null {
    const weeks = [
      ...(this.quality?.weeks ?? []),
      ...(this.points?.weeks ?? []),
    ];
    let oldest: Date | null = null;
    for (const week of weeks) {
      const start = this.weekDate(week);
      if (start && (!oldest || start < oldest)) {
        oldest = start;
      }
    }
    return oldest;
  }

  private rangeIsFilled(
    range: Exclude<TrendRange, 'all'>,
    oldest: Date | null,
  ): boolean {
    return oldest !== null && oldest < this.rangeStart(range);
  }

  private rangeStart(range: Exclude<TrendRange, 'all'>): Date {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    if (range === '3m') {
      start.setMonth(start.getMonth() - 3);
    } else if (range === '1y') {
      start.setFullYear(start.getFullYear() - 1);
    } else {
      start.setFullYear(start.getFullYear() - 5);
    }
    return start;
  }

  private weekDate(iso: string): Date | null {
    const [year, month, day] = iso.split('-').map((part) => Number(part));
    if (!year || !month || !day) {
      return null;
    }
    return new Date(year, month - 1, day);
  }

  private accumulate(points: number[]): number[] {
    let sum = 0;
    return points.map((value) => {
      sum += value;
      return sum;
    });
  }

  private weekLabel(iso: string): string {
    const [year, month, day] = iso.split('-').map((part) => Number(part));
    if (!year || !month || !day) {
      return iso;
    }
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: '2-digit',
    });
  }

  private lineOptions(
    theme: ReturnType<typeof getChartThemeColors>,
    max: number | undefined,
  ) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: theme.textColor },
        },
      },
      scales: {
        x: {
          ticks: { color: theme.mutedTextColor },
          grid: { color: theme.gridColor },
        },
        y: {
          beginAtZero: true,
          max,
          ticks: { color: theme.mutedTextColor },
          grid: { color: theme.gridColor },
        },
      },
    };
  }
}
