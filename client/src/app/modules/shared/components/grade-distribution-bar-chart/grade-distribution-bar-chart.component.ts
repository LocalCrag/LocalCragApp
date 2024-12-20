import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { debounceTime, fromEvent, Observable } from 'rxjs';
import { Grade, GRADES } from '../../../../utility/misc/grades';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';
import { NgIf } from '@angular/common';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { MOBILE_BREAKPOINT } from '../../../../utility/misc/breakpoints';
import { Store } from '@ngrx/store';
import { selectBarChartColor } from '../../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { getRgbObject } from '../../../../utility/misc/color';

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
  @Input() fetchingObservable: Observable<Grade[]>;
  @Input() scaleName: string = 'FB';
  @Input() excludeProjects: boolean = false;

  public grades: Grade[];
  public data: any;
  public options: any;
  public totalCount: number;
  public projectCount: number;

  private isCondensed: boolean = null;

  constructor(
    private translocoService: TranslocoService,
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
      this.fetchingObservable.subscribe((grades) => {
        this.grades = grades;
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
    this.store
      .select(selectBarChartColor)
      .pipe(take(1))
      .subscribe((barChartColor) => {
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
        const usedScaleName = this.isCondensed
          ? this.scaleName + '_CONDENSED'
          : this.scaleName;
        let gradesInUsedScale = GRADES[usedScaleName];
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
        const gradesInFullScale = GRADES[this.scaleName];
        gradesInFullScale.map((grade) => {
          for (const usedGrade of gradesInUsedScale) {
            if (usedGrade.value >= grade.value) {
              condensedSortingMap[grade.value] = usedGrade.value;
              break;
            }
          }
        });

        // Count values
        this.grades.map(
          (grade) => (gradeValueCount[condensedSortingMap[grade.value]] += 1),
        );

        // Build chart data
        const labels = gradesInUsedScale.map((grade) =>
          this.translocoService.translate(grade.name),
        );
        const counts = gradeValues.map(
          (gradeValue) => gradeValueCount[gradeValue],
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
        this.totalCount = this.grades.length;
      });
  }
}
