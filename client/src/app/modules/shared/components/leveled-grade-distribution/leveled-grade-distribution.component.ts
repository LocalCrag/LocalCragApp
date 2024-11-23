import { Component, Input, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { Grade, GradeDistribution } from '../../../../models/scale';
import { LineType } from '../../../../enums/line-type';
import { ScalesService } from '../../../../services/crud/scales.service';

/**
 * Component that displays a leveled grade distribution.
 */
@Component({
  selector: 'lc-leveled-grade-distribution',
  templateUrl: './leveled-grade-distribution.component.html',
  styleUrls: ['./leveled-grade-distribution.component.scss'],
})
export class LeveledGradeDistributionComponent implements OnInit {
  @Input() fetchingObservable: Observable<GradeDistribution>;

  public level1: number = 0;
  public level2: number = 0;
  public level3: number = 0;
  public level4: number = 0;
  public level5: number = 0;
  public total: number = 0;
  public gradeDistribution: GradeDistribution["BOULDER"]["scaleName"];

  constructor(private scalesService: ScalesService) {
  }

  ngOnInit() {
    this.fetchingObservable.subscribe((gradeDistributions) => {
      this.gradeDistribution = gradeDistributions["BOULDER"]["FB"];  // todo hardcoded values
      this.buildGradeDistribution();
    });
  }

  /**
   * Sorts the grades in buckets and calculates the total count for each bucket.
   */
  buildGradeDistribution() {
    // todo hardcoded thresholds
    for (const gradeValue of Object.keys(this.gradeDistribution).map(Number)) {
      const count = this.gradeDistribution[gradeValue];
      this.total += count;
      if (gradeValue <= 0) {
        this.level5 += count;
      } else if (gradeValue > 0 && gradeValue < 10) {
        this.level1 += count;
      } else if (gradeValue >= 10 && gradeValue < 16) {
        this.level2 += count;
      } else if (gradeValue >= 16 && gradeValue < 22) {
        this.level3 += count;
      } else if (gradeValue >= 22) {
        this.level4 += count;
      }
    }
  }
}
