import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormArray } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';
import { Message } from 'primeng/message';
import { MeterGroup } from 'primeng/metergroup';
import { Tag } from 'primeng/tag';
import { Store } from '@ngrx/store';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { combineLatest, merge } from 'rxjs';
import { startWith } from 'rxjs/operators';
import {
  selectBarChartColor,
  selectDarkBarChartColor,
} from '../../../ngrx/selectors/instance-settings.selectors';
import {
  getChartThemeColors,
  resolveBarChartColor,
} from '../../../utility/chart-theme';
import { textColor } from '../../../utility/misc/color';
import {
  BarBracketPreview,
  buildBarBracketPreview,
  buildStackedBracketPreview,
  StackedBracketPreview,
} from '../../../utility/scale/bracket-preview';
import { ThemeService } from '../../../services/core/theme.service';

type PreviewMode = 'stacked' | 'bar';

/**
 * Live sample of how the scale form's intervals bucket the grades currently
 * entered on the form. One grade counts as one line.
 */
@Component({
  selector: 'lc-scale-bracket-preview',
  templateUrl: './scale-bracket-preview.component.html',
  styleUrl: './scale-bracket-preview.component.scss',
  imports: [TranslocoDirective, ChartModule, Message, MeterGroup, Tag],
})
export class ScaleBracketPreviewComponent implements OnChanges {
  @Input({ required: true }) mode: PreviewMode;
  @Input({ required: true }) grades: FormArray;
  @Input({ required: true }) brackets: FormArray;

  public stacked: StackedBracketPreview | null = null;
  public bar: BarBracketPreview | null = null;
  public chartData: unknown = null;
  public chartOptions: unknown = null;
  public readonly chartPlugins = [ChartDataLabels];

  /** Non-empty stacked segments in the shape PrimeNG's meter group expects. */
  public meterItems: { label: string; color: string; value: number }[] = [];

  private barColor = '#ef4444';
  private listeningToForm = false;

  private destroyRef = inject(DestroyRef);
  private transloco = inject(TranslocoService);
  private store = inject(Store);
  private themeService = inject(ThemeService);

  constructor() {
    combineLatest([
      this.store.select(selectBarChartColor),
      this.store.select(selectDarkBarChartColor),
      toObservable(this.themeService.isDarkMode),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([color, darkColor, isDarkMode]) => {
        this.barColor = resolveBarChartColor(color, darkColor, isDarkMode);
        this.rebuild();
      });

    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuild());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['grades'] && !changes['brackets']) {
      return;
    }
    if (!this.grades || !this.brackets) {
      return;
    }
    if (this.listeningToForm) {
      this.rebuild();
      return;
    }
    this.listeningToForm = true;
    merge(this.grades.valueChanges, this.brackets.valueChanges)
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.rebuild());
  }

  tagTextColor(color: string): string {
    if (/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(color)) {
      return textColor(color, '#2e3132') ?? '#2e3132';
    }
    return '#2e3132';
  }

  private rebuild(): void {
    if (!this.grades || !this.brackets || !this.mode) {
      return;
    }
    if (this.mode === 'stacked') {
      this.bar = null;
      this.chartData = null;
      this.stacked = buildStackedBracketPreview(
        this.grades.value,
        this.brackets.value,
        {
          until: this.transloco.translate('leveledGradeDistributionUntil'),
          from: this.transloco.translate('leveledGradeDistributionFrom'),
        },
      );
      this.meterItems = (this.stacked?.segments ?? [])
        .filter((segment) => segment.count > 0)
        .map((segment) => ({
          label: segment.label,
          color: segment.color,
          value: segment.count,
        }));
      return;
    }

    this.stacked = null;
    this.meterItems = [];
    this.bar = buildBarBracketPreview(this.grades.value, this.brackets.value);
    if (!this.bar || this.bar.gradedCount === 0) {
      this.chartData = null;
      this.chartOptions = null;
      return;
    }
    const { textColor: labelColor } = getChartThemeColors();
    this.chartData = {
      labels: this.bar.buckets.map((bucket) => bucket.label),
      datasets: [
        {
          data: this.bar.buckets.map((bucket) => bucket.count),
          backgroundColor: this.barColor,
          borderWidth: 0,
        },
      ],
    };
    this.chartOptions = {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 0, right: 0, top: 18, bottom: 0 },
      },
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: {
          align: 'end',
          anchor: 'end',
          offset: 0,
          clip: false,
          color: labelColor,
          font: { weight: 'normal' },
          display: (ctx: { dataset: { data: unknown[] }; dataIndex: number }) =>
            Number(ctx.dataset.data[ctx.dataIndex]) > 0,
          formatter: (value: unknown) =>
            typeof value === 'number' && value > 0 ? String(value) : '',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          border: { display: false },
          ticks: { display: false, color: labelColor },
          grid: { display: false },
        },
        x: {
          border: { display: false },
          ticks: {
            color: labelColor,
            autoSkip: false,
            maxRotation: 40,
            minRotation: 0,
            font: { size: 11 },
          },
          grid: { display: false },
        },
      },
    };
  }
}
