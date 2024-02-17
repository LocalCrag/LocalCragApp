import {Component, Input, OnChanges, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {Observable} from 'rxjs';
import {Grade, GRADES} from '../../../../utility/misc/grades';
import {TranslocoDirective, TranslocoService} from '@ngneat/transloco';
import {ChartModule} from 'primeng/chart';
import {NgIf} from '@angular/common';
import {marker} from '@ngneat/transloco-keys-manager/marker';

/**
 * Component that shows grades in a bar chart.
 */
@Component({
  selector: 'lc-grade-distribution-bar-chart',
  standalone: true,
  imports: [
    ChartModule,
    NgIf,
    TranslocoDirective
  ],
  templateUrl: './grade-distribution-bar-chart.component.html',
  styleUrl: './grade-distribution-bar-chart.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class GradeDistributionBarChartComponent implements OnChanges{

  @Input() fetchingObservable: Observable<Grade[]>;
  @Input() scaleName: string = 'FB';

  public grades: Grade[];
  public data: any;
  public options: any;
  public totalCount: number;
  public projectCount: number;

  constructor(private translocoService: TranslocoService) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes['fetchingObservable']){
      this.fetchingObservable.subscribe(grades => {
        this.grades = grades;
        this.buildData();
      })
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
          bottom: 0
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          enabled: false
        },
        legend: {
          display: false
        },
        datalabels: {
          align: 'end',
          offset: 0,
          anchor: 'end',
          color: textColor,
          font: {
            weight: 'normal'
          },
          clip: false
        }
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
            display: false
          }
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
            display: false
          }
        }
      }
    };
  }

  /**
   * Builds the charts.js data object for displaying the grades in a chart.
   */
  buildData() {
    const genericProjectGrade: Grade = {
      name: marker('GENERIC_PROJECT'),
      value: 0
    }
    let gradesInScale = [...GRADES[this.scaleName]];
    gradesInScale = gradesInScale.filter(grade => grade.value > 0);
    gradesInScale.unshift(genericProjectGrade);
    const gradeValues = gradesInScale.map(grade => grade.value);
    const gradeValueCount = {};
    gradeValues.map(gradeValue => {
      gradeValueCount[gradeValue] = 0;
    });
    this.grades.map(grade => gradeValueCount[grade.value > 0 ? grade.value : 0] += 1);
    const labels = gradesInScale.map(grade => this.translocoService.translate(grade.name));
    const counts = gradeValues.map(gradeValue => gradeValueCount[gradeValue]);
    const maxCount = Math.max(...counts);
    const backgroundColors = counts.map(count => {
      return `rgba(213, 30, 38, ${(count / maxCount) * 0.5 + 0.5})`; // todo get color from some config
    });
    this.data = {
      labels: labels,
      datasets: [
        {
          data: counts,
          borderWidth: 0,
          backgroundColor: backgroundColors,
        }
      ]
    };
    this.projectCount = counts[0];
    this.totalCount = this.grades.length;
  }

}
