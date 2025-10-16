import { Component, Input, OnInit } from '@angular/core';
import { isSeasonEmpty, Season } from '../../../../models/season';
import { ChartModule } from 'primeng/chart';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { selectBarChartColor } from '../../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { getRgbObject } from '../../../../utility/misc/color';
import { Message } from 'primeng/message';
import { NgIf } from '@angular/common';

@Component({
  selector: 'lc-season-chart',
  imports: [ChartModule, Message, NgIf, TranslocoDirective],
  templateUrl: './season-chart.component.html',
  styleUrl: './season-chart.component.scss',
})
export class SeasonChartComponent implements OnInit {
  @Input() season: Season;

  data: any;
  options: any;
  seasonEmpty = true;

  constructor(
    private translocoService: TranslocoService,
    private store: Store,
  ) {}

  ngOnInit() {
    this.seasonEmpty = isSeasonEmpty(this.season);
    this.store
      .select(selectBarChartColor)
      .pipe(take(1))
      .subscribe((barChartColor) => {
        const rgbObject = getRgbObject(barChartColor);
        const bgColor = `rgba(${rgbObject.r}, ${rgbObject.g}, ${rgbObject.b}, 0.4)`;
        this.data = {
          labels: [
            this.translocoService.translate(marker('January')),
            this.translocoService.translate(marker('February')),
            this.translocoService.translate(marker('March')),
            this.translocoService.translate(marker('April')),
            this.translocoService.translate(marker('May')),
            this.translocoService.translate(marker('June')),
            this.translocoService.translate(marker('July')),
            this.translocoService.translate(marker('August')),
            this.translocoService.translate(marker('September')),
            this.translocoService.translate(marker('October')),
            this.translocoService.translate(marker('November')),
            this.translocoService.translate(marker('December')),
          ],
          datasets: [
            {
              data: [
                this.season['1'],
                this.season['2'],
                this.season['3'],
                this.season['4'],
                this.season['5'],
                this.season['6'],
                this.season['7'],
                this.season['8'],
                this.season['9'],
                this.season['10'],
                this.season['11'],
                this.season['12'],
              ],
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 0,
              borderColor: barChartColor,
              backgroundColor: bgColor,
            },
          ],
        };
        this.options = {
          scales: {
            y: {
              ticks: {
                display: false,
              },
              grid: {
                drawTicks: false,
                display: false,
              },
            },
          },
          plugins: {
            tooltip: {
              enabled: false,
            },
            datalabels: {
              display: false,
            },
            legend: {
              display: false,
            },
          },
        };
      });
  }
}
