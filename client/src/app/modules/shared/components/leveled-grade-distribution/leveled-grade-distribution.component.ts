import {
  Component,
  Input,
  OnInit,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';
import { GradeDistribution } from '../../../../models/scale';
import { LineType } from '../../../../enums/line-type';
import { ScalesService } from '../../../../services/crud/scales.service';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { map } from 'rxjs/operators';
import {
  getStackedChartBracketColor,
  getStackedChartBracketValue,
} from '../../../../utility/scale/stacked-chart-brackets';
import { textColor } from '../../../../utility/misc/color';
import { Tag } from 'primeng/tag';
import { MeterGroup } from 'primeng/metergroup';
import { Skeleton } from 'primeng/skeleton';
import {
  defaultLineListAdvancedFilters,
  LineListFiltersPersisted,
} from '../../../line/line-list-filters/line-list-filter.logic';
import { saveLineListFilters } from '../../../line/line-list-filters/line-list-filters.storage';

type MeterValue = {
  color: string;
  value: number;
  label: string;
  minGrade: number;
  maxGrade: number;
};

type StackChartData = {
  lineType: LineType;
  gradeScale: string;
  projects: number;
  ungraded: number;
  total: number;
  meterValues: MeterValue[];
};

/**
 * Component that displays a leveled grade distribution.
 */
@Component({
  selector: 'lc-leveled-grade-distribution',
  templateUrl: './leveled-grade-distribution.component.html',
  styleUrls: ['./leveled-grade-distribution.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [Tag, MeterGroup, Skeleton, TranslocoDirective],
})
export class LeveledGradeDistributionComponent implements OnInit {
  @Input() fetchingObservable: Observable<GradeDistribution>;
  /** When set, tags navigate here after persisting matching line-list grade filters. */
  @Input() linesListUrl: string;

  public stackChartData: StackChartData[] = null;
  public gradeDistribution: GradeDistribution;
  public gradeDistributionEmpty = true;
  public value = [];

  private scalesService = inject(ScalesService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);

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
        observables.push(
          forkJoin([
            this.scalesService.getScale(lineType as LineType, gradeScale),
            this.scalesService.gradeNameByValueMap(
              lineType as LineType,
              gradeScale,
            ),
          ]).pipe(
            map(([scale, gradeNameByValueMap]) => {
              const stackedBrackets = scale.gradeBrackets.stackedChartBrackets;
              const labels = Array(stackedBrackets.length).fill('');
              const sortedGrades = [...scale.grades].sort(
                (a, b) => a.value - b.value,
              );
              const nextGradeValue = Object.fromEntries(
                sortedGrades.map((g, i, a) =>
                  i != a.length - 1
                    ? [g.value, a[i + 1].value]
                    : [g.value, null],
                ),
              );
              const nextGradeName = Object.fromEntries(
                sortedGrades.map((g, i, a) => {
                  return i != a.length - 1
                    ? [g.value, a[i + 1].name]
                    : [g.value, ''];
                }),
              );
              const positiveGrades = sortedGrades.filter((g) => g.value > 0);
              const firstPositiveGrade =
                positiveGrades.length > 0 ? positiveGrades[0].value : 1;
              const maxGradeValue =
                positiveGrades.length > 0
                  ? positiveGrades[positiveGrades.length - 1].value
                  : firstPositiveGrade;

              for (let i = 0; i < stackedBrackets.length; i++) {
                const bracketValue = getStackedChartBracketValue(
                  stackedBrackets[i],
                );
                if (i == 0) {
                  labels[i] =
                    `${this.translocoService.translate(marker('leveledGradeDistributionUntil'))} ${gradeNameByValueMap[bracketValue]}`;
                } else if (i == stackedBrackets.length - 1) {
                  labels[i] =
                    `${this.translocoService.translate(marker('leveledGradeDistributionFrom'))} ${gradeNameByValueMap[bracketValue]}`;
                } else {
                  const startName =
                    nextGradeName[
                      getStackedChartBracketValue(stackedBrackets[i - 1])
                    ];
                  const endName = gradeNameByValueMap[bracketValue];
                  labels[i] =
                    startName === endName
                      ? startName
                      : `${startName} - ${endName}`;
                }
              }

              const data: StackChartData = {
                lineType: lineType as LineType,
                gradeScale,
                projects: 0,
                ungraded: 0,
                total: 0,
                meterValues: Array.from(
                  { length: stackedBrackets.length },
                  (_, i) => {
                    const bracketValue = getStackedChartBracketValue(
                      stackedBrackets[i],
                    );
                    let minGrade: number;
                    let maxGrade: number;
                    if (i === 0) {
                      minGrade = firstPositiveGrade;
                      maxGrade = bracketValue;
                    } else if (i === stackedBrackets.length - 1) {
                      minGrade = bracketValue;
                      maxGrade = maxGradeValue;
                    } else {
                      const previousBracket = getStackedChartBracketValue(
                        stackedBrackets[i - 1],
                      );
                      minGrade =
                        nextGradeValue[previousBracket] ?? previousBracket + 1;
                      maxGrade = bracketValue;
                    }
                    return {
                      color: getStackedChartBracketColor(stackedBrackets[i], i),
                      value: 0,
                      label: null,
                      minGrade,
                      maxGrade,
                    };
                  },
                ),
              };
              for (const gradeValue of Object.keys(
                this.gradeDistribution[lineType][gradeScale],
              ).map(Number)) {
                const count =
                  this.gradeDistribution[lineType][gradeScale][gradeValue];
                data.total += count;
                if (gradeValue === 0) {
                  data.ungraded += count;
                } else if (gradeValue < 0) {
                  data.projects += count;
                } else {
                  for (let i = 0; i < stackedBrackets.length; i++) {
                    const bracket = getStackedChartBracketValue(
                      stackedBrackets[i],
                    );
                    if (i == stackedBrackets.length - 1) {
                      data.meterValues[i].value += count;
                    } else if (gradeValue <= bracket) {
                      data.meterValues[i].value += count;
                      break;
                    }
                  }
                }
              }
              // Add the labels to the data
              data.meterValues.forEach((meterValue, i) => {
                meterValue.label = labels[i];
              });
              // Drop all meter values that are zero
              data.meterValues = data.meterValues.filter(
                (meterValue) => meterValue.value > 0,
              );
              stackChartData.push(data);
            }),
          ),
        );
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

  onGradeRangeClick(
    event: Event,
    data: StackChartData,
    minGrade: number,
    maxGrade: number,
  ): void {
    if (!this.linesListUrl) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const payload: LineListFiltersPersisted = {
      advanced: defaultLineListAdvancedFilters(),
      grade: {
        scale: {
          lineType: data.lineType,
          gradeScale: data.gradeScale,
        },
        range: [minGrade, maxGrade],
      },
    };
    saveLineListFilters(payload);
    void this.router.navigateByUrl(this.linesListUrl);
  }

  protected readonly textColor = textColor;
}
