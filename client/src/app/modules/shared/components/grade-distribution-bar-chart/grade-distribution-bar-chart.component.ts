import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation, } from '@angular/core';
import { debounceTime, forkJoin, fromEvent, Observable } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';
import { NgIf } from '@angular/common';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { MOBILE_BREAKPOINT } from '../../../../utility/misc/breakpoints';
import { Store } from '@ngrx/store';
import { selectBarChartColor } from '../../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { getRgbObject } from '../../../../utility/misc/color';
import { Grade, GradeDistribution } from '../../../../models/scale';
import { ScalesService } from '../../../../services/crud/scales.service';
import { LineType } from '../../../../enums/line-type';

/**
 * Component that shows grades in a bar chart.
 */
@Component({
  selector: 'lc-grade-distribution-bar-chart',
  standalone: true,
  imports: [ChartModule, NgIf, TranslocoDirective],
  templateUrl: './grade-distribution-bar-chart.component.html',
  styleUrl: './grade-distribution-bar-chart.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GradeDistributionBarChartComponent implements OnChanges, OnInit {
  @Input() fetchingObservable: Observable<GradeDistribution>;
  @Input() scaleName: string = 'FB'; // todo hardcoded values
  @Input() excludeProjects: boolean = false;

  public gradeDistribution: GradeDistribution["BOULDER"]["scaleName"];
  public data: any;
  public options: any;
  public totalCount: number;
  public projectCount: number;

  private isCondensed: boolean = null;

  constructor(
    private translocoService: TranslocoService,
    private scalesService: ScalesService,
    private store: Store,
  ) {
    fromEvent(window, 'resize')
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.buildData();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fetchingObservable']) {
      this.fetchingObservable.subscribe((gradeDistributions) => {
        // todo for now just take the first distribution
        this.gradeDistribution = Object.values(gradeDistributions)[0][this.scaleName];
        this.buildData();
      });
    }
  }

  ngOnInit() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color-secondary');
    this.options = {
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
        tooltip: {
          enabled: false,
        },
        legend: {
          display: false,
        },
        datalabels: {
          align: 'end',
          offset: 0,
          anchor: 'end',
          color: textColor,
          font: {
            weight: 'normal',
          },
          clip: false,
        },
      },
      scales: {
        y: {
          border: {
            display: false,
          },
          beginAtZero: true,
          ticks: {
            color: textColor,
            beginAtZero: true,
            display: false,
          },
          grid: {
            drawBorder: false,
            display: false,
          },
        },
        x: {
          border: {
            display: false,
          },
          ticks: {
            color: textColor,
            maxRotation: 0,
            autoSkip: false,
          },
          grid: {
            drawBorder: false,
            display: false,
          },
        },
      },
    };
  }

  /**
   * Builds the charts.js data object for displaying the grades in a chart.
   */
  buildData() {
    forkJoin([
      this.store
        .select(selectBarChartColor)
        .pipe(take(1)),
      this.scalesService.getScale(LineType.BOULDER, this.scaleName),
    ]).subscribe(([barChartColor, scale]) => {
        const genericProjectGrade: Grade = {
          name: marker('GENERIC_PROJECT'),
          value: 0,
        };

        // Condensed scale is needed if screen is too small to host all grades
        const condensed = window.innerWidth <= MOBILE_BREAKPOINT;
        if (condensed == this.isCondensed) {
          // If the condensed value didn't change, we don't need to redraw!
          return;
        }
        this.isCondensed = window.innerWidth <= MOBILE_BREAKPOINT;
        let gradesInUsedScale = scale.grades.sort((a, b) => a.value - b.value);
        gradesInUsedScale = gradesInUsedScale.filter(
          (grade) => grade.value > 0,
        );
        gradesInUsedScale.unshift(genericProjectGrade);

        // Init a counting map
        const gradeValues = gradesInUsedScale.map((grade) => grade.value);
        const gradeValueCount = {};
        gradeValues.map((gradeValue) => {
          gradeValueCount[gradeValue] = 0;
        });

        // Map keys from the full scale to keys of the used scale
        const condensedSortingMap = {};
        const gradesInFullScale = scale.grades;
        gradesInFullScale.map((grade) => {
          for (const usedGrade of gradesInUsedScale) {
            if (usedGrade.value >= grade.value) {
              condensedSortingMap[grade.value] = usedGrade.value;
              break;
            }
          }
        });

        // Build chart data
        const labels = gradesInUsedScale.map((grade) =>
          grade.value > 0 ? grade.name : this.translocoService.translate(grade.name),
        );
        const counts = gradeValues.map(
          (gradeValue) => this.gradeDistribution[gradeValue] ?? 0,
        );
        this.projectCount = counts[0];
        const maxCount = Math.max(...counts);
        const backgroundColors = counts.map((count) => {
          const rgbObject = getRgbObject(barChartColor);
          return `rgba(${rgbObject.r}, ${rgbObject.g}, ${rgbObject.b}, ${(count / maxCount) * 0.5 + 0.5})`;
        });
        const includeProjectsInChart = false;
        if (!includeProjectsInChart) {
          labels.shift();
          counts.shift();
          backgroundColors.shift();
        }
        this.data = {
          labels: labels,
          datasets: [
            {
              data: counts,
              borderWidth: 0,
              backgroundColor: backgroundColors,
            },
          ],
        };
        this.totalCount = counts.reduce((a, b) => a + b, 0);
      });
  }
}
