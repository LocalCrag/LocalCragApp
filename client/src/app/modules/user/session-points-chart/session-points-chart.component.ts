import {
  Component,
  DestroyRef,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ChartModule } from 'primeng/chart';
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { LineType } from '../../../enums/line-type';
import { UserSession } from '../../../models/user-statistics';
import { ScalesService } from '../../../services/crud/scales.service';
import { ThemeService } from '../../../services/core/theme.service';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { getChartThemeColors } from '../../../utility/chart-theme';
import { scaleChoiceLabel } from '../../../utility/grade/scale-choice-label';
import {
  GradeCount,
  SessionBar,
  SessionMetric,
  SessionRange,
  SessionScale,
  defaultSessionScale,
  filledSessionRanges,
  formatSessionDate,
  gradeCounts,
  listSessionScales,
  sessionBarValue,
  sessionBars,
  sessionScaleKey,
} from './session-points';

Chart.register(ChartDataLabels);

type Choice<T> = { value: T; label: string };
type ScaleChoice = { key: string; label: string };

@Component({
  selector: 'lc-session-points-chart',
  imports: [
    TranslocoDirective,
    FormsModule,
    ChartModule,
    Message,
    Select,
    SelectButton,
  ],
  templateUrl: './session-points-chart.component.html',
  styleUrl: './session-points-chart.component.scss',
})
export class SessionPointsChartComponent implements OnChanges, OnInit {
  @Input() sessions: UserSession[] | null = null;
  @Input() barChartColor: string | null = null;

  metric: SessionMetric = 'points';
  range: SessionRange = '1y';
  scaleKey = '';
  metricOptions: Choice<SessionMetric>[] = [];
  rangeOptions: Choice<SessionRange>[] = [];
  scaleOptions: ScaleChoice[] = [];
  chartData: unknown = null;
  chartOptions: unknown = null;
  chartMinWidth: number | null = null;
  bars: SessionBar[] = [];
  selectedDate: string | null = null;

  private scales: SessionScale[] = [];
  private gradeNames: Record<number, string> = {};
  private transloco = inject(TranslocoService);
  private scalesService = inject(ScalesService);
  private translateSpecialGrades = inject(TranslateSpecialGradesService);
  private themeService = inject(ThemeService);
  private zone = inject(NgZone);
  private destroyRef = inject(DestroyRef);

  constructor() {
    toObservable(this.themeService.isDarkMode)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.paint());
  }

  ngOnInit() {
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.paint());
  }

  ngOnChanges() {
    this.syncScale();
    this.refreshRangeOptions();
    this.paint();
  }

  onControlsChange() {
    this.selectedDate = null;
    this.paint();
  }

  onScaleChange() {
    this.selectedDate = null;
    this.loadGradeNames();
    this.refreshRangeOptions();
    this.paint();
  }

  selectedBar(): SessionBar | null {
    return this.bars.find((bar) => bar.date === this.selectedDate) ?? null;
  }

  selectedRows(): GradeCount[] {
    const bar = this.selectedBar();
    return bar ? gradeCounts(bar.grades) : [];
  }

  gradeCountLabel(row: GradeCount): string {
    const grade = this.gradeLabel(row.gradeValue);
    if (row.count === 1) {
      return grade;
    }
    return this.transloco.translate(marker('user.charts.sessionGradeCount'), {
      grade,
      count: row.count,
    });
  }

  selectedTitle(): string {
    const bar = this.selectedBar();
    if (!bar) {
      return '';
    }
    return `${formatSessionDate(bar.date, true)} · ${sessionBarValue(bar, this.metric)} ${this.metricLabel()}`;
  }

  private syncScale() {
    const groups = this.sessions ?? [];
    this.scales = listSessionScales(groups);
    const current = this.scales.find(
      (scale) =>
        sessionScaleKey(scale.lineType, scale.gradeScale) === this.scaleKey,
    );
    if (!current) {
      const next = defaultSessionScale(groups);
      this.scaleKey = next
        ? sessionScaleKey(next.lineType, next.gradeScale)
        : '';
      this.loadGradeNames();
    }
  }

  private refreshRangeOptions() {
    const scale = this.currentScale();
    const dates = (this.sessions ?? [])
      .filter(
        (group) =>
          scale &&
          sessionScaleKey(group.lineType, group.gradeScale) ===
            sessionScaleKey(scale.lineType, scale.gradeScale),
      )
      .map((group) => group.date);
    const available = filledSessionRanges(dates, new Date());
    if (available.length > 0 && !available.includes(this.range)) {
      this.range = 'all';
    }
    const labels: Record<SessionRange, string> = {
      '3m': this.transloco.translate(marker('user.charts.sessionRange3Months')),
      '1y': this.transloco.translate(marker('user.charts.sessionRange1Year')),
      '5y': this.transloco.translate(marker('user.charts.sessionRange5Years')),
      all: this.transloco.translate(marker('user.charts.sessionRangeAll')),
    };
    this.rangeOptions = available.map((value) => ({
      value,
      label: labels[value],
    }));
  }

  private metricLabel(): string {
    return this.transloco.translate(
      this.metric === 'points'
        ? marker('user.charts.sessionMetricPoints')
        : marker('user.charts.sessionMetricCount'),
    );
  }

  private paint() {
    this.refreshRangeOptions();
    this.metricOptions = [
      {
        value: 'points',
        label: this.transloco.translate(
          marker('user.charts.sessionMetricPoints'),
        ),
      },
      {
        value: 'count',
        label: this.transloco.translate(
          marker('user.charts.sessionMetricCount'),
        ),
      },
    ];
    this.scaleOptions = this.scales.map((scale) => ({
      key: sessionScaleKey(scale.lineType, scale.gradeScale),
      label: scaleChoiceLabel(
        this.transloco.translate(scale.lineType),
        scale.gradeScale,
      ),
    }));
    const scale = this.currentScale();
    this.bars = scale
      ? sessionBars(this.sessions ?? [], scale, this.range, new Date())
      : [];
    if (!this.bars.some((bar) => bar.date === this.selectedDate)) {
      this.selectedDate = null;
    }
    this.chartMinWidth = this.bars.length > 16 ? this.bars.length * 36 : null;
    if (this.bars.length === 0) {
      this.chartData = null;
      this.chartOptions = null;
      return;
    }
    const includeYear =
      this.bars.length === 1 ||
      this.bars[0].date.slice(0, 4) !==
        this.bars[this.bars.length - 1].date.slice(0, 4);
    const { textColor, gridColor } = getChartThemeColors();
    const showPointLabels = this.bars.length <= 16;
    this.chartData = {
      labels: this.bars.map((bar) => formatSessionDate(bar.date, includeYear)),
      datasets: [
        {
          label: this.metricLabel(),
          data: this.bars.map((bar) => sessionBarValue(bar, this.metric)),
          borderColor: this.barChartColor,
          backgroundColor: this.barChartColor,
          borderWidth: 2,
          tension: 0.2,
          fill: false,
          pointRadius: this.bars.length > 40 ? 2 : 4,
          pointHoverRadius: 6,
          pointHitRadius: 12,
        },
      ],
    };
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
      layout: { padding: { top: 20, right: 8, bottom: 0, left: 0 } },
      onClick: (_event: unknown, elements: { index: number }[]) => {
        const index = elements[0]?.index;
        this.zone.run(() => {
          const bar = typeof index === 'number' ? this.bars[index] : undefined;
          this.selectedDate =
            bar && bar.date !== this.selectedDate ? bar.date : null;
        });
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items: { dataIndex: number }[]) => {
              const bar = this.bars[items[0]?.dataIndex];
              return bar ? formatSessionDate(bar.date, true) : '';
            },
            label: (item: { parsed: { y: number } }) =>
              `${this.metricLabel()}: ${item.parsed.y}`,
            afterBody: (items: { dataIndex: number }[]) => {
              const bar = this.bars[items[0]?.dataIndex];
              return bar
                ? gradeCounts(bar.grades).map((row) =>
                    this.gradeCountLabel(row),
                  )
                : [];
            },
          },
        },
        datalabels: {
          display: showPointLabels,
          align: 'top',
          anchor: 'end',
          offset: 2,
          clip: false,
          color: textColor,
          font: { weight: 'normal' },
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
          ticks: { color: textColor, maxRotation: 0, autoSkip: true },
          grid: { display: false },
        },
      },
    };
  }

  private currentScale(): SessionScale | null {
    return (
      this.scales.find(
        (scale) =>
          sessionScaleKey(scale.lineType, scale.gradeScale) === this.scaleKey,
      ) ?? null
    );
  }

  private loadGradeNames() {
    this.gradeNames = {};
    const scale = this.currentScale();
    if (!scale) {
      return;
    }
    const requestKey = sessionScaleKey(scale.lineType, scale.gradeScale);
    this.scalesService
      .gradeNameByValueMap(scale.lineType as LineType, scale.gradeScale)
      .pipe(
        take(1),
        catchError(() => of<Record<number, string>>({})),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((names) => {
        if (this.scaleKey !== requestKey) {
          return;
        }
        this.gradeNames = names ?? {};
      });
  }

  private gradeLabel(value: number): string {
    const name = this.gradeNames[value];
    return name ? this.translateSpecialGrades.translate(name) : String(value);
  }
}
