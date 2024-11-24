import { Component, Input, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { Grade, GradeDistribution } from '../../../../models/scale';
import { LineType } from '../../../../enums/line-type';
import { ScalesService } from '../../../../services/crud/scales.service';

type StackChartData = {
  lineType: LineType;
  gradeScale: string;
  data: {
    level1: number;
    level2: number;
    level3: number;
    level4: number;
    level5: number;
  };
  total: number;
}

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

  public stackChartData = [];
  public gradeDistribution: GradeDistribution;
  public gradeDistributionEmpty = true;

  constructor(private scalesService: ScalesService) {
  }

  ngOnInit() {
    this.fetchingObservable.subscribe((gradeDistributions) => {
      this.gradeDistribution = gradeDistributions;
      this.buildGradeDistribution();
    });
  }

  /**
   * Sorts the grades in buckets and calculates the total count for each bucket.
   */
  buildGradeDistribution() {
    // todo hardcoded thresholds
    const stackChartData: StackChartData[] = [];
    let gradeDistributionEmpty = true;

    for (const lineType in this.gradeDistribution) {
      for (const gradeScale in this.gradeDistribution[lineType]) {
        const data: StackChartData = {
          lineType: lineType as LineType,
          gradeScale,
          data : {
            level1: 0,
            level2: 0,
            level3: 0,
            level4: 0,
            level5: 0,
          },
          total: 0,
        }
        for (const gradeValue of Object.keys(this.gradeDistribution[lineType][gradeScale]).map(Number)) {
          gradeDistributionEmpty = false;

          const count = this.gradeDistribution[lineType][gradeScale][gradeValue];
          data.total += count;
          if (gradeValue <= 0) {
            data.data.level5 += count;
          } else if (gradeValue > 0 && gradeValue < 10) {
            data.data.level1 += count;
          } else if (gradeValue >= 10 && gradeValue < 16) {
            data.data.level2 += count;
          } else if (gradeValue >= 16 && gradeValue < 22) {
            data.data.level3 += count;
          } else if (gradeValue >= 22) {
            data.data.level4 += count;
          }
        }
        stackChartData.push(data);
      }
    }

    this.gradeDistributionEmpty = gradeDistributionEmpty;
    this.stackChartData = stackChartData.sort((a, b) => a.total - b.total);
  }
}
