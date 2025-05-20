import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { debounceTime, forkJoin, fromEvent, Observable } from 'rxjs';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';
import { NgForOf, NgIf } from '@angular/common';
import { MOBILE_BREAKPOINT } from '../../../../utility/misc/breakpoints';
import { Store } from '@ngrx/store';
import { selectBarChartColor } from '../../../../ngrx/selectors/instance-settings.selectors';
import { map, take } from 'rxjs/operators';
import { getRgbObject } from '../../../../utility/misc/color';
import { GradeDistribution } from '../../../../models/scale';
import { ScalesService } from '../../../../services/crud/scales.service';
import { LineType } from '../../../../enums/line-type';

import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
Chart.register(ChartDataLabels);

type BarChartData = {
  lineType: LineType;
  gradeScale: string;
  data: any;
  totalCount: number;
  projectCount: number;
  ungradedCount: number;
};

/**
 * Component that shows grades in a bar chart.
 */
@Component({
  selector: 'lc-grade-distribution-bar-chart',
  imports: [ChartModule, NgIf, TranslocoDirective, NgForOf],
  templateUrl: './grade-distribution-bar-chart.component.html',
  styleUrl: './grade-distribution-bar-chart.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GradeDistributionBarChartComponent implements OnChanges, OnInit {
  @Input() fetchingObservable: Observable<GradeDistribution>;
  @Input() excludeProjects: boolean = false;

  public gradeDistribution: GradeDistribution;
  public chartData: BarChartData[] = [];
  public options: any;

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
      this.fetchingObservable.subscribe((gradeDistribution) => {
        this.gradeDistribution = gradeDistribution;
        this.buildData();
      });
    }
  }

  ngOnInit() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
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
    const scaleObservers: Observable<BarChartData>[] = [];

    const condensed = window.innerWidth <= MOBILE_BREAKPOINT;
    if (condensed == this.isCondensed) {
      // If the condensed value didn't change, we don't need to redraw!
      return;
    }
    this.isCondensed = condensed;

    for (const lineType in this.gradeDistribution) {
      for (const gradeScale in this.gradeDistribution[lineType]) {
        scaleObservers.push(
          forkJoin([
            this.store.select(selectBarChartColor).pipe(take(1)),
            this.scalesService.getScale(lineType as LineType, gradeScale),
          ]).pipe(
            map(([barChartColor, scale]) => {
              // Condensed scale is needed if screen is too small to host all grades
              const usedScale = condensed
                ? scale.gradeBrackets.barChartBrackets
                : scale.grades;

              // Because of the way the condensed scale is built, we need to replace the last grade value
              // with the maximum grade value of the full scale (if not condensed, this has no effect)
              usedScale[usedScale.length - 1].value = Math.max(
                ...scale.grades.map((grade) => grade.value),
              );

              // Sort grades in ascending order
              let gradesInUsedScale = usedScale.sort(
                (a, b) => a.value - b.value,
              );

              // Filter out projects
              gradesInUsedScale = gradesInUsedScale.filter(
                (grade) => grade.value > 0,
              );

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

              // Apply condensedSortingMap to gradeDistribution
              const mappedGradeDistribution = {};
              for (const gradeValue in this.gradeDistribution[lineType][
                gradeScale
              ]) {
                if (Number(gradeValue) <= 0) {
                  continue;
                }
                const condensedGradeValue = condensedSortingMap[gradeValue];
                if (condensedGradeValue) {
                  if (!mappedGradeDistribution[condensedGradeValue]) {
                    mappedGradeDistribution[condensedGradeValue] = 0;
                  }
                  mappedGradeDistribution[condensedGradeValue] +=
                    this.gradeDistribution[lineType][gradeScale][gradeValue];
                }
              }

              // Build chart data
              const labels = gradesInUsedScale.map((grade) =>
                grade.value > 0
                  ? grade.name
                  : this.translocoService.translate(grade.name),
              );
              const counts = gradeValues.map(
                (gradeValue) => mappedGradeDistribution[gradeValue] ?? 0,
              );
              const maxCount = Math.max(...counts);
              const backgroundColors = counts.map((count) => {
                const rgbObject = getRgbObject(barChartColor);
                return `rgba(${rgbObject.r}, ${rgbObject.g}, ${rgbObject.b}, ${(count / maxCount) * 0.5 + 0.5})`;
              });
              const projectCount =
                (this.gradeDistribution[lineType][gradeScale]['-2'] ?? 0) +
                (this.gradeDistribution[lineType][gradeScale]['-1'] ?? 0);
              const ungradedCount =
                this.gradeDistribution[lineType][gradeScale]['0'] ?? 0;
              return {
                lineType: lineType as LineType,
                gradeScale,
                data: {
                  labels: labels,
                  datasets: [
                    {
                      data: counts,
                      borderWidth: 0,
                      backgroundColor: backgroundColors,
                    },
                  ],
                },
                projectCount: projectCount,
                ungradedCount: ungradedCount,
                totalCount: counts.reduce((a, b) => a + b, 0),
              };
            }),
          ),
        );
      }
    }

    forkJoin(scaleObservers).subscribe((chartData) => {
      this.chartData = chartData.sort((a, b) => a.totalCount - b.totalCount);
    });
  }
}
