import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Observable} from 'rxjs';
import {Grade} from '../../../../utility/misc/grades';

/**
 * Component that displays a leveled grade distribution.
 */
@Component({
  selector: 'lc-leveled-grade-distribution',
  templateUrl: './leveled-grade-distribution.component.html',
  styleUrls: ['./leveled-grade-distribution.component.scss']
})
export class LeveledGradeDistributionComponent implements OnChanges {

  @Input() fetchingObservable: Observable<Grade[]>;

  public level1: number = 0;
  public level2: number = 0;
  public level3: number = 0;
  public level4: number = 0;
  public level5: number = 0;
  public grades: Grade[];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fetchingObservable']) {
      this.fetchingObservable.subscribe(grades => {
        this.grades = grades;
        this.buildGradeDistribution();
      })
    }
  }

  /**
   * Sorts the grades in buckets and calculates the total count for each bucket.
   */
  buildGradeDistribution() {
    this.grades.map(grade => {
      if (grade.value < 0) {
        this.level5++;
      }
      if (grade.value > 0 && grade.value < 10) {
        this.level1++;
      }
      if (grade.value >= 10 && grade.value < 16) {
        this.level2++;
      }
      if (grade.value >= 16 && grade.value < 22) {
        this.level3++;
      }
      if (grade.value >= 22) {
        this.level4++;
      }
    })
  }

}
