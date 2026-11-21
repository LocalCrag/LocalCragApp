import {
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { isSeasonEmpty, Season } from '../../../../models/season';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import {
  selectBarChartColor,
  selectDarkBarChartColor,
} from '../../../../ngrx/selectors/instance-settings.selectors';
import { combineLatest } from 'rxjs';
import {
  getChartThemeColors,
  resolveBarChartColor,
  toRgba,
} from '../../../../utility/chart-theme';
import { ThemeService } from '../../../../services/core/theme.service';
import { ChartJsDirective } from '../../directives/chart-js.directive';

@Component({
  selector: 'lc-season-chart',
  imports: [
    ChartJsDirective,
    HlmAlert,
    HlmAlertDescription,
    NgIcon,
    TranslocoDirective,
  ],
  providers: [provideIcons({ lucideInfo })],
  templateUrl: './season-chart.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './season-chart.component.scss',
})
export class SeasonChartComponent implements OnInit {
  @Input() season: Season;
  @Input() ascentCount = 0;

  data: any;
  options: any;
  seasonEmpty = true;

  private translocoService = inject(TranslocoService);
  private store = inject(Store);
  private themeService = inject(ThemeService);
  private destroyRef = inject(DestroyRef);
  private colorsReady = false;
  private barChartColor: string | null = null;
  private darkBarChartColor: string | null = null;
  private isDarkMode = false;

  constructor() {
    combineLatest([
      this.store.select(selectBarChartColor),
      this.store.select(selectDarkBarChartColor),
      toObservable(this.themeService.isDarkMode),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([barChartColor, darkBarChartColor, isDarkMode]) => {
        this.barChartColor = barChartColor;
        this.darkBarChartColor = darkBarChartColor;
        this.isDarkMode = isDarkMode;
        this.colorsReady = true;
        this.buildChart();
      });
  }

  ngOnInit() {
    this.seasonEmpty = isSeasonEmpty(this.season);
    this.buildChart();
  }

  protected get showChart(): boolean {
    return !this.seasonEmpty && this.ascentCount > 100;
  }

  private buildChart() {
    if (!this.colorsReady || !this.season || !this.showChart) {
      return;
    }

    const color = resolveBarChartColor(
      this.barChartColor,
      this.darkBarChartColor,
      this.isDarkMode,
    );
    const { textColor } = getChartThemeColors();
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
          backgroundColor: toRgba(color, 0.4),
        },
      ],
    };
    this.options = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            color: textColor,
          },
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            display: false,
          },
          grid: {
            drawTicks: false,
            display: false,
          },
          border: {
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
  }
}
