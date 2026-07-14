import { Component, DestroyRef, Input, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { isSeasonEmpty, Season } from '../../../../models/season';
import { ChartModule } from 'primeng/chart';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import {
  selectBarChartColor,
  selectDarkBarChartColor,
} from '../../../../ngrx/selectors/instance-settings.selectors';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import { resolveBarChartColor, toRgba } from '../../../../utility/chart-theme';
import { ThemeService } from '../../../../services/core/theme.service';
import { Message } from 'primeng/message';

@Component({
  selector: 'lc-season-chart',
  imports: [ChartModule, Message, TranslocoDirective],
  templateUrl: './season-chart.component.html',
  styleUrl: './season-chart.component.scss',
})
export class SeasonChartComponent implements OnInit {
  @Input() season: Season;

  data: any;
  options: any;
  seasonEmpty = true;

  private translocoService = inject(TranslocoService);
  private store = inject(Store);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.seasonEmpty = isSeasonEmpty(this.season);

    combineLatest([
      this.store.select(selectBarChartColor).pipe(take(1)),
      this.store.select(selectDarkBarChartColor).pipe(take(1)),
      toObservable(this.themeService.isDarkMode),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([barChartColor, darkBarChartColor, isDarkMode]) => {
        const color = resolveBarChartColor(
          barChartColor,
          darkBarChartColor,
          isDarkMode,
        );
        const bgColor = toRgba(color, 0.4);
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
              borderColor: color,
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
