import { Component, Input, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { GradeDistribution } from '../../../../models/scale';
import { LineType } from '../../../../enums/line-type';
import { ScalesService } from '../../../../services/crud/scales.service';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { map } from 'rxjs/operators';

type StackChartData = {
  lineType: LineType;
  gradeScale: string;
  projects: number;
  brackets: number[];
  bracketLabels: string[];
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

  public stackChartData = null;
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
    const observables: Observable<any>[] = [];

    for (const lineType in this.gradeDistribution) {
      for (const gradeScale in this.gradeDistribution[lineType]) {
        observables.push(forkJoin([
          this.scalesService.getScale(lineType as LineType, gradeScale),
          this.scalesService.gradeNameByValueMap(lineType as LineType, gradeScale)
        ]).pipe(map(([scale, gradeNameByValueMap]) => {
          const labels = Array(scale.gradeBrackets.length).fill("");

          const nextGradeName = Object.fromEntries(
            scale.grades.sort((a, b) => a.value - b.value)
              .map((g, i, a) => {
                return i != a.length - 1 ? [g.value, a[i + 1].name] : [g.value, ""];
              })
          );

          for (let i = 0; i < scale.gradeBrackets.length; i++) {
            if (i == 0) {
              labels[i] = `${this.translocoService.translate(marker("leveledGradeDistributionUntil"))} ${gradeNameByValueMap[scale.gradeBrackets[i]]}`;
            } else if (i == scale.gradeBrackets.length - 1) {
              labels[i] = `${this.translocoService.translate(marker("leveledGradeDistributionFrom"))} ${gradeNameByValueMap[scale.gradeBrackets[i]]}`;
            } else {
              labels[i] = `${nextGradeName[scale.gradeBrackets[i-1]]} - ${gradeNameByValueMap[scale.gradeBrackets[i]]}`;
            }
          }

          const data: StackChartData = {
            lineType: lineType as LineType,
            gradeScale,
            projects: 0,
            brackets: Array(scale.gradeBrackets.length).fill(0),
            bracketLabels: labels,
            total: 0,
          }
          for (const gradeValue of Object.keys(this.gradeDistribution[lineType][gradeScale]).map(Number)) {
            const count = this.gradeDistribution[lineType][gradeScale][gradeValue];
            data.total += count;
            if (gradeValue <= 0) {
              data.projects += count;
            } else {
              for (let i = 0; i < scale.gradeBrackets.length; i++) {
                const bracket = scale.gradeBrackets[i];
                if (i == scale.gradeBrackets.length - 1) {
                  data.brackets[i] += count;
                } else if (gradeValue <= bracket) {
                  data.brackets[i] += count;
                  break;
                }
              }
            }
          }
          stackChartData.push(data);
        })));
      }
    }

    if (observables.length == 0) {
      this.gradeDistributionEmpty = false;
    } else {
      forkJoin(observables).subscribe(() => {
        this.stackChartData = stackChartData.sort((a, b) => a.total - b.total);
        this.gradeDistributionEmpty = false;
      });
    }
  }
}
