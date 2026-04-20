import { Component, Input, OnChanges, inject } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';
import { Message } from 'primeng/message';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';

Chart.register(ChartDataLabels);

@Component({
  selector: 'lc-ascents-per-year-chart',
  imports: [TranslocoDirective, ChartModule, Message],
  templateUrl: './ascents-per-year-chart.component.html',
})
export class AscentsPerYearChartComponent implements OnChanges {
  @Input() ascentsPerYear: Record<string, number> | null = null;
  @Input() barChartColor: string | null = null;

  public yearChartData: any;
  public yearChartOptions: any;

  private transloco = inject(TranslocoService);

  ngOnChanges(): void {
    this.buildYearChart();
  }

  private buildYearChart() {
    const valuesByYear = this.ascentsPerYear ?? {};
    const years = Object.keys(valuesByYear).sort();
    const values = years.map((y) => valuesByYear[y]);

    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');

    this.yearChartData = {
      labels: years,
      datasets: [
        {
          label: this.transloco.translate('user.charts.ascentsPerYear'),
          data: values,
          backgroundColor: this.barChartColor,
          borderWidth: 0,
        },
      ],
    };

    this.yearChartOptions = {
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
          grid: { color: 'rgba(128,128,128,0.15)' },
        },
        x: {
          ticks: { color: textColor },
          grid: { display: false },
        },
      },
    };
  }
}
