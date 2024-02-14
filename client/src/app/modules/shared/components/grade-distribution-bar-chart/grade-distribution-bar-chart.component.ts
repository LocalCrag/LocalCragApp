import {Component, Input, ViewEncapsulation} from '@angular/core';
import {Observable} from 'rxjs';
import {Grade, GRADES} from '../../../../utility/misc/grades';
import {TranslocoService} from '@ngneat/transloco';
import {ChartModule} from 'primeng/chart';
import {NgIf} from '@angular/common';

/**
 * Component that shows grades in a bar chart.
 */
@Component({
  selector: 'lc-grade-distribution-bar-chart',
  standalone: true,
  imports: [
    ChartModule,
    NgIf
  ],
  templateUrl: './grade-distribution-bar-chart.component.html',
  styleUrl: './grade-distribution-bar-chart.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class GradeDistributionBarChartComponent {

  @Input() fetchingObservable: Observable<Grade[]>; // todo update when changes
  @Input() scaleName: string = 'FB';

  public grades: Grade[];

  public data: any;
  public options: any;

  constructor(private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.fetchingObservable.subscribe(grades => {
      this.grades = grades;
      this.buildGradeDistribution();
    })

    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');
    this.options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: textColorSecondary,
            beginAtZero: true,
            callback: function(value) {if (value % 1 === 0) {return value;}}
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: textColorSecondary
          },
          grid: {
            color: surfaceBorder,
            drawBorder: false,
              display:false
          }
        }
      }
    };
  }

  /**
   * Builds the charts.js data object for displaying the grades in a chart.
   */
  buildGradeDistribution(){
    const gradeValues =  GRADES[this.scaleName].map(grade => grade.value);
    const gradeValueCount = {};
    gradeValues.map(gradeValue => {
      gradeValueCount[gradeValue] = 0;
    });
    this.grades.map(grade => gradeValueCount[grade.value] += 1);
    const labels = GRADES[this.scaleName].map(grade => this.translocoService.translate(grade.name));
    const counts = gradeValues.map(gradeValue => gradeValueCount[gradeValue])
    this.data = {
      labels: labels,
      datasets: [
        {
          data: counts,
          borderWidth: 1
        }
      ]
    };
  }

}
