import { Component, Input, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { GradeDistribution } from '../../../../models/scale';
import { LineType } from '../../../../enums/line-type';
import { ScalesService } from '../../../../services/crud/scales.service';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { map } from 'rxjs/operators';
import { textColor } from '../../../../utility/misc/color';

type StackChartData = {
  lineType: LineType;
  gradeScale: string;
  projects: number;
  total: number;
  meterValues: { color: string; value: number; label: string }[];
};

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

  public stackChartData: any = null;
  public gradeDistribution: GradeDistribution;
  public gradeDistributionEmpty = true;
  value = [
    { label: 'Apps', color: '#34d399', value: 16 },
    { label: 'Messages', color: '#fbbf24', value: 8 },
    { label: 'Media', color: '#60a5fa', value: 24 },
    { label: 'System', color: '#c084fc', value: 10 },
  ];

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
    const colors = [
      'var(--yellow-500)',
      'var(--blue-500)',
      'var(--red-500)',
      'var(--green-500)',
      'var(--orange-500)',
      'var(--teal-500)',
      'var(--indigo-500)',
      'var(--bluegray-500)',
    ];
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
              const labels = Array(
                scale.gradeBrackets.stackedChartBrackets.length,
              ).fill('');

              const nextGradeName = Object.fromEntries(
                scale.grades
                  .sort((a, b) => a.value - b.value)
                  .map((g, i, a) => {
                    return i != a.length - 1
                      ? [g.value, a[i + 1].name]
                      : [g.value, ''];
                  }),
              );

              for (
                let i = 0;
                i < scale.gradeBrackets.stackedChartBrackets.length;
                i++
              ) {
                if (i == 0) {
                  labels[i] =
                    `${this.translocoService.translate(marker('leveledGradeDistributionUntil'))} ${gradeNameByValueMap[scale.gradeBrackets.stackedChartBrackets[i]]}`;
                } else if (
                  i ==
                  scale.gradeBrackets.stackedChartBrackets.length - 1
                ) {
                  labels[i] =
                    `${this.translocoService.translate(marker('leveledGradeDistributionFrom'))} ${gradeNameByValueMap[scale.gradeBrackets.stackedChartBrackets[i]]}`;
                } else {
                  labels[i] =
                    `${nextGradeName[scale.gradeBrackets.stackedChartBrackets[i - 1]]} - ${gradeNameByValueMap[scale.gradeBrackets.stackedChartBrackets[i]]}`;
                }
              }

              const data: StackChartData = {
                lineType: lineType as LineType,
                gradeScale,
                projects: 0,
                total: 0,
                meterValues: Array.from(
                  { length: scale.gradeBrackets.stackedChartBrackets.length },
                  (_, i) => ({
                    color: colors[i % colors.length],
                    value: 0,
                    label: null,
                  }),
                ),
              };
              for (const gradeValue of Object.keys(
                this.gradeDistribution[lineType][gradeScale],
              ).map(Number)) {
                const count =
                  this.gradeDistribution[lineType][gradeScale][gradeValue];
                data.total += count;
                if (gradeValue <= 0) {
                  data.projects += count;
                } else {
                  for (
                    let i = 0;
                    i < scale.gradeBrackets.stackedChartBrackets.length;
                    i++
                  ) {
                    const bracket = scale.gradeBrackets.stackedChartBrackets[i];
                    if (
                      i ==
                      scale.gradeBrackets.stackedChartBrackets.length - 1
                    ) {
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

  protected readonly textColor = textColor;
}
