import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  inject,
} from '@angular/core';
import {
  Chart,
  ChartData,
  ChartOptions,
  ChartType,
  registerables,
} from 'chart.js';

Chart.register(...registerables);

/**
 * Renders a Chart.js chart on a canvas. Replaces PrimeNG `p-chart`, which wrapped
 * the same Chart.js data and options objects.
 */
@Directive({
  selector: 'canvas[lcChartJs]',
})
export class ChartJsDirective implements OnChanges, OnDestroy {
  @Input({ required: true }) lcChartJs!: ChartType;
  @Input() data: ChartData | null = null;
  @Input() options: ChartOptions | null = null;

  private chart: Chart | null = null;
  private element = inject(ElementRef<HTMLCanvasElement>);

  ngOnChanges(): void {
    if (!this.data) {
      return;
    }
    if (this.chart) {
      this.chart.data = this.data;
      this.chart.options = this.options ?? {};
      this.chart.update();
      return;
    }
    this.chart = new Chart(this.element.nativeElement, {
      type: this.lcChartJs,
      data: this.data,
      options: this.options ?? {},
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
