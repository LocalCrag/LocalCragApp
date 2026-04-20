import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import {
  debounceTime,
  forkJoin,
  fromEvent,
  Observable,
  Subscription,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ChartModule } from 'primeng/chart';

import { MOBILE_BREAKPOINT } from '../../../../utility/misc/breakpoints';
import { Store } from '@ngrx/store';
import {
  selectBarChartAccentColor,
  selectBarChartColor,
} from '../../../../ngrx/selectors/instance-settings.selectors';
import { map, take } from 'rxjs/operators';
import { GradeDistribution } from '../../../../models/scale';
import { ScalesService } from '../../../../services/crud/scales.service';
import { LineType } from '../../../../enums/line-type';

import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'chart.js';
import { Message } from 'primeng/message';
Chart.register(ChartDataLabels);

type BarChartData = {
  lineType: LineType;
  gradeScale: string;
  data: any;
  totalCount: number;
  projectCount: number;
  ungradedCount: number;
  chartOptions?: any;
};

/**
 * Component that shows grades in a bar chart.
 */
@Component({
  selector: 'lc-grade-distribution-bar-chart',
  imports: [ChartModule, TranslocoDirective, Message],
  templateUrl: './grade-distribution-bar-chart.component.html',
  styleUrl: './grade-distribution-bar-chart.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class GradeDistributionBarChartComponent implements OnChanges, OnInit {
  @Input() fetchingObservable: Observable<GradeDistribution>;
  /** When set, grades are shown as stacked bars (non-flash + flash). */
  @Input() fetchingFlashObservable?: Observable<GradeDistribution>;
  @Input() excludeProjects: boolean = false;
  @Input() excludeUngraded: boolean = false;
  /** Optional hover tooltip with ascent/flash counts for each bar. */
  @Input() showDetailedTooltip: boolean = false;

  public gradeDistribution: GradeDistribution;
  public flashDistribution: GradeDistribution | null = null;
  public chartData: BarChartData[] = [];
  public options: any;

  private isCondensed: boolean | null = null;
  private translocoService = inject(TranslocoService);
  private scalesService = inject(ScalesService);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private dataSubscription: Subscription | null = null;

  constructor() {
    fromEvent(window, 'resize')
      .pipe(debounceTime(200), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.isCondensed = null;
        this.buildData();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['fetchingObservable'] || changes['fetchingFlashObservable']) {
      this.dataSubscription?.unsubscribe();
      this.dataSubscription = null;
      if (!this.fetchingObservable) {
        return;
      }
      if (this.fetchingFlashObservable) {
        this.dataSubscription = forkJoin({
          grades: this.fetchingObservable,
          flashes: this.fetchingFlashObservable,
        })
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(({ grades, flashes }) => {
            this.gradeDistribution = grades;
            this.flashDistribution = flashes;
            this.buildData();
          });
      } else {
        this.dataSubscription = this.fetchingObservable
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((grades) => {
            this.gradeDistribution = grades;
            this.flashDistribution = null;
            this.buildData();
          });
      }
    }
  }

  ngOnInit() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--p-text-color');
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
          // Show a datalabel only for bars with a positive count.
          display: (ctx: {
            dataset: { data: unknown[] };
            dataIndex: number;
          }) => {
            const v = ctx.dataset.data[ctx.dataIndex];
            return typeof v === 'number' && v > 0;
          },
          // Render the bar count as label text; hide zero/invalid values.
          formatter: (value: unknown) =>
            typeof value === 'number' && value > 0 ? String(value) : '',
        },
      },
      scales: {
        y: {
          border: {
            display: false,
          },
          beginAtZero: true,
          stacked: false,
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
          stacked: false,
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
    if (!this.gradeDistribution) {
      return;
    }

    const scaleObservers: Observable<BarChartData>[] = [];

    const condensed = window.innerWidth <= MOBILE_BREAKPOINT;
    this.isCondensed = condensed;

    for (const lineType in this.gradeDistribution) {
      for (const gradeScale in this.gradeDistribution[lineType]) {
        scaleObservers.push(
          forkJoin([
            this.store.select(selectBarChartColor).pipe(take(1)),
            this.store.select(selectBarChartAccentColor).pipe(take(1)),
            this.scalesService.getScale(lineType as LineType, gradeScale),
          ]).pipe(
            map(([barChartColor, barChartAccentColor, scale]) => {
              const usedScale = condensed
                ? [...scale.gradeBrackets.barChartBrackets]
                : [...scale.grades];

              // Because of the way the condensed scale is built, we need to replace the last grade value
              // with the maximum grade value of the full scale (if not condensed, this has no effect)
              usedScale[usedScale.length - 1].value = Math.max(
                ...scale.grades.map((grade) => grade.value),
              );

              // Sort grades in ascending order
              let gradesInUsedScale = usedScale.sort(
                (a, b) => a.value - b.value,
              );

              // Filter out projects
              gradesInUsedScale = gradesInUsedScale.filter(
                (grade) => grade.value > 0,
              );

              // Collect the grade values that will be shown on the x-axis.
              const gradeValues = gradesInUsedScale.map((grade) => grade.value);

              // Map each full-scale grade value to the nearest visible bucket.
              const condensedSortingMap: Record<number, number> = {};
              const gradesInFullScale = scale.grades;
              gradesInFullScale.forEach((grade) => {
                for (const usedGrade of gradesInUsedScale) {
                  if (usedGrade.value >= grade.value) {
                    condensedSortingMap[grade.value] = usedGrade.value;
                    break;
                  }
                }
              });

              // Map the grade distribution to the condensed scale
              const mappedTotal = this.mapGradesToBuckets(
                this.gradeDistribution,
                lineType,
                gradeScale,
                condensedSortingMap,
              );

              // Map the flash distribution to the condensed scale
              const mappedFlash = this.flashDistribution
                ? this.mapGradesToBuckets(
                    this.flashDistribution,
                    lineType,
                    gradeScale,
                    condensedSortingMap,
                  )
                : null;

              // Build aligned totals/flash/non-flash counts per visible bucket.
              const countsFull = gradeValues.map(
                (gradeValue) => mappedTotal[gradeValue] ?? 0,
              );
              const flashRaw = mappedFlash
                ? gradeValues.map((gradeValue) => mappedFlash[gradeValue] ?? 0)
                : null;
              const flashCountsFull = flashRaw
                ? flashRaw.map((f, i) => Math.min(f, countsFull[i]))
                : null;
              const nonFlashCountsFull = flashCountsFull
                ? countsFull.map((c, i) => Math.max(0, c - flashCountsFull[i]))
                : countsFull;

              // Drop only trailing (hardest) grades with no ascents; always keep
              // the easiest grades, including zeros in the middle.
              let visibleLen = countsFull.length;
              while (visibleLen > 1 && countsFull[visibleLen - 1] === 0) {
                visibleLen--;
              }
              const gradesVisible = gradesInUsedScale.slice(0, visibleLen);
              const labels = gradesVisible.map((grade) =>
                grade.value > 0
                  ? grade.name
                  : this.translocoService.translate(grade.name),
              );
              const counts = countsFull.slice(0, visibleLen);
              const flashCounts = flashCountsFull
                ? flashCountsFull.slice(0, visibleLen)
                : null;
              const nonFlashCounts = flashCounts
                ? nonFlashCountsFull.slice(0, visibleLen)
                : counts;

              // Collect the project and ungraded counts
              const projectCount =
                (this.gradeDistribution[lineType][gradeScale]['-2'] ?? 0) +
                (this.gradeDistribution[lineType][gradeScale]['-1'] ?? 0);
              const ungradedCount =
                this.gradeDistribution[lineType][gradeScale]['0'] ?? 0;

              // Determine if the chart should be stacked
              const stacked = !!flashCounts?.some((n) => n > 0);

              // Set the colors for the chart
              const nonFlashColor = barChartColor?.trim() || 'rgb(239, 68, 68)';
              const flashColor =
                barChartAccentColor?.trim() || 'rgb(250, 204, 21)';

              // Stacked bar: first dataset = bottom of bar (flash), second = top (repeat / redpoint).
              const datasets = stacked
                ? [
                    {
                      label: this.translocoService.translate(
                        'user.charts.legendFlash',
                      ),
                      data: flashCounts,
                      borderWidth: 0,
                      backgroundColor: flashColor,
                    },
                    {
                      label: this.translocoService.translate(
                        'user.charts.legendNonFlash',
                      ),
                      data: nonFlashCounts,
                      borderWidth: 0,
                      backgroundColor: nonFlashColor,
                    },
                  ]
                : [
                    {
                      data: counts,
                      borderWidth: 0,
                      backgroundColor: nonFlashColor,
                    },
                  ];

              // Configure the tooltip
              const tooltipOptions = this.showDetailedTooltip
                ? {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                      label: (ctx: {
                        dataIndex: number;
                        datasetIndex: number;
                        dataset: { label?: string };
                      }) => {
                        const idx = ctx.dataIndex;
                        if (!stacked) {
                          const ascents = counts[idx] ?? 0;
                          return `${this.translocoService.translate('user.charts.totalAscents')}: ${ascents}`;
                        }
                        if (ctx.datasetIndex === 0) {
                          const flashes = flashCounts?.[idx] ?? 0;
                          return `${this.translocoService.translate('user.charts.flashes')}: ${flashes}`;
                        }
                        const ascents = counts[idx] ?? 0;
                        // Use translated dataset label for the non-flash segment line
                        const label =
                          ctx.dataset.label ||
                          this.translocoService.translate(
                            'user.charts.totalAscents',
                          );
                        return `${label}: ${ascents}`;
                      },
                    },
                  }
                : { enabled: false };

              // Configure the base chart options
              const chartOptionsBase = {
                ...this.options,
                plugins: {
                  ...this.options.plugins,
                  tooltip: tooltipOptions,
                },
              };

              // Configure the chart options for stacked bars
              const chartOptions = stacked
                ? {
                    ...chartOptionsBase,
                    plugins: {
                      ...chartOptionsBase.plugins,
                      legend: {
                        display: true,
                        labels: {
                          color: this.options.scales.x.ticks.color,
                        },
                      },
                      datalabels: {
                        ...this.options.plugins.datalabels,
                        display: (ctx: {
                          chart: {
                            data: { datasets: { data: unknown[] }[] };
                            isDatasetVisible: (datasetIndex: number) => boolean;
                          };
                          datasetIndex: number;
                          dataIndex: number;
                        }) => {
                          const { chart, datasetIndex, dataIndex } = ctx;
                          const datasets = chart.data.datasets;
                          const targetDatasetIndex = [...datasets.keys()]
                            .reverse()
                            .find((i) => chart.isDatasetVisible(i));
                          if (
                            targetDatasetIndex == null ||
                            datasetIndex !== targetDatasetIndex
                          ) {
                            return false;
                          }
                          const nonFlashVisible = chart.isDatasetVisible(1);
                          const shownValue = nonFlashVisible
                            ? datasets.reduce(
                                (sum, ds) =>
                                  sum + (Number(ds.data[dataIndex]) || 0),
                                0,
                              )
                            : Number(datasets[0].data[dataIndex]) || 0;
                          return shownValue > 0;
                        },
                        formatter: (
                          _value: unknown,
                          ctx: {
                            chart: {
                              data: { datasets: { data: unknown[] }[] };
                              isDatasetVisible: (
                                datasetIndex: number,
                              ) => boolean;
                            };
                            dataIndex: number;
                          },
                        ) => {
                          const { chart, dataIndex } = ctx;
                          const datasets = chart.data.datasets;
                          const nonFlashVisible = chart.isDatasetVisible(1);
                          const shownValue = nonFlashVisible
                            ? datasets.reduce(
                                (sum, ds) =>
                                  sum + (Number(ds.data[dataIndex]) || 0),
                                0,
                              )
                            : Number(datasets[0].data[dataIndex]) || 0;
                          return shownValue > 0 ? String(shownValue) : '';
                        },
                      },
                    },
                    scales: {
                      ...this.options.scales,
                      x: { ...this.options.scales.x, stacked: true },
                      y: { ...this.options.scales.y, stacked: true },
                    },
                  }
                : chartOptionsBase;

              return {
                lineType: lineType as LineType,
                gradeScale,
                data: {
                  labels: labels,
                  datasets,
                },
                projectCount: projectCount,
                ungradedCount: ungradedCount,
                totalCount: counts.reduce((a, b) => a + b, 0),
                chartOptions,
              };
            }),
          ),
        );
      }
    }

    forkJoin(scaleObservers).subscribe((chartData) => {
      this.chartData = chartData.sort((a, b) => a.totalCount - b.totalCount);
    });
  }

  /**
   * Maps the grade distribution to the condensed scale.
   */
  private mapGradesToBuckets(
    distribution: GradeDistribution,
    lineType: string,
    gradeScale: string,
    condensedSortingMap: Record<number, number>,
  ): Record<number, number> {
    const mapped: Record<number, number> = {};
    const bucket = distribution[lineType]?.[gradeScale];
    if (!bucket) {
      return mapped;
    }
    for (const gradeValueKey in bucket) {
      if (Number(gradeValueKey) <= 0) {
        continue;
      }
      const condensedGradeValue = condensedSortingMap[Number(gradeValueKey)];
      if (condensedGradeValue == null) {
        continue;
      }
      const add = Number(bucket[gradeValueKey]) || 0;
      mapped[condensedGradeValue] = (mapped[condensedGradeValue] ?? 0) + add;
    }
    return mapped;
  }
}
