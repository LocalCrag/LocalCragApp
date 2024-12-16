import { Component, Input, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { GradeDistribution } from '../../../../models/scale';
import { LineType } from '../../../../enums/line-type';
import { ScalesService } from '../../../../services/crud/scales.service';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

type StackChartData = {
  lineType: LineType;
  gradeScale: string;
  data: {
    projects: number;
    brackets: number[];
    bracketLabels: string[];
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

  constructor(
    private scalesService: ScalesService,
    private translocoService: TranslocoService,
  ) {}

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
    const stackChartData: StackChartData[] = [];
    let gradeDistributionEmpty = true;

    for (const lineType in this.gradeDistribution) {
      for (const gradeScale in this.gradeDistribution[lineType]) {
        forkJoin([
          this.scalesService.getScale(lineType as LineType, gradeScale),
          this.scalesService.gradeNameByValueMap(lineType as LineType, gradeScale)
        ]).subscribe(([scale, gradeNameByValueMap]) => {
            const labels = Array(scale.gradeBrackets.length).fill("");

            for (let i = 0; i < scale.gradeBrackets.length; i++) {
              if (i == 0) {
                labels.push(`${this.translocoService.translate(marker("leveledGradeDistributionUntil"))} ${gradeNameByValueMap[scale.gradeBrackets[i]]}`);
              } else if (i == scale.gradeBrackets.length - 1) {
                labels.push(`${this.translocoService.translate(marker("leveledGradeDistributionFrom"))} ${gradeNameByValueMap[scale.gradeBrackets[i]]}`);
              } else {
                labels.push(`${gradeNameByValueMap[scale.gradeBrackets[i-1] + 1]} - ${gradeNameByValueMap[scale.gradeBrackets[i]]}`); // todo here we assume that grade values are spaced by 1
              }
            }

            const data: StackChartData = {
              lineType: lineType as LineType,
              gradeScale,
              data: {
                projects: 0,
                brackets: Array(scale.gradeBrackets.length).fill(0),
                bracketLabels: labels,
              },
              total: 0,
            }
            for (const gradeValue of Object.keys(this.gradeDistribution[lineType][gradeScale]).map(Number)) {
              gradeDistributionEmpty = false;

              const count = this.gradeDistribution[lineType][gradeScale][gradeValue];
              data.total += count;
              if (gradeValue <= 0) {
                data.data.projects += count;
              } else {
                for (let i = 0; i < scale.gradeBrackets.length; i++) {
                  const bracket = scale.gradeBrackets[i];
                  if (i == scale.gradeBrackets.length - 1) {
                    data.data.brackets[i] += count;
                  } else if (gradeValue <= bracket) {
                    data.data.brackets[i] += count;
                    break;
                  }
                }
              }
            }
            stackChartData.push(data);
        });
      }
    }

    this.gradeDistributionEmpty = gradeDistributionEmpty;
    this.stackChartData = stackChartData.sort((a, b) => a.total - b.total);
  }
}
