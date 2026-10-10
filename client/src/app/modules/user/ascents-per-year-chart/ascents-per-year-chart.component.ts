import { Component, DestroyRef, Input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';
import { Message } from 'primeng/message';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import { getChartThemeColors } from '../../../utility/chart-theme';
import { ThemeService } from '../../../services/core/theme.service';

Chart.register(ChartDataLabels);

@Component({
  selector: 'lc-ascents-per-year-chart',
  imports: [TranslocoDirective, ChartModule, Message],
  templateUrl: './ascents-per-year-chart.component.html',
  styleUrl: './ascents-per-year-chart.component.scss',
})
export class AscentsPerYearChartComponent implements OnChanges {
  @Input() ascentsPerYear: Record<string, number> | null = null;
  @Input() barChartColor: string | null = null;
  /** Overrides the default "ascents per year" dataset label. */
  @Input() datasetLabel: string | null = null;
  /** Overrides the empty-state message. */
  @Input() emptyText: string | null = null;
  /** Skip the draw animation. Dense charts on the statistics page hitch otherwise. */
  @Input() animate = true;

  public yearChartData: any;
  public yearChartOptions: any;

  private transloco = inject(TranslocoService);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    toObservable(this.themeService.isDarkMode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.buildYearChart());
  }

  ngOnChanges(): void {
    this.buildYearChart();
  }

  private buildYearChart() {
    const valuesByYear = this.ascentsPerYear ?? {};
    const years = Object.keys(valuesByYear).sort();
    const values = years.map((y) => valuesByYear[y]);
    const { textColor, gridColor } = getChartThemeColors();

    this.yearChartData = {
      labels: years,
      datasets: [
        {
          label:
            this.datasetLabel ??
            this.transloco.translate('user.charts.ascentsPerYear'),
          data: values,
          backgroundColor: this.barChartColor,
          borderWidth: 0,
        },
      ],
    };

    this.yearChartOptions = {
      animation: this.animate ? undefined : false,
      layout: {
        padding: {
          left: 0,
          right: 0,
          top: 20,
          bottom: 0,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: true },
        datalabels: {
          align: 'end',
          offset: 0,
          anchor: 'end',
          color: textColor,
          font: {
            weight: 'normal',
          },
          clip: false,
          display: (ctx: {
            dataset: { data: unknown[] };
            dataIndex: number;
          }) => {
            const v = ctx.dataset.data[ctx.dataIndex];
            return typeof v === 'number' && v > 0;
          },
          formatter: (value: unknown) =>
            typeof value === 'number' && value > 0 ? String(value) : '',
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColor,
            precision: 0,
            stepSize: 1,
          },
          grid: { color: gridColor },
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false },
        },
      },
    };
  }
}
