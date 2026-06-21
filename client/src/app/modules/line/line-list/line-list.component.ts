import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { LinesService } from '../../../services/crud/lines.service';
import { select, Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { TicksService } from '../../../services/crud/ticks.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AscentCountComponent } from '../../ascent/ascent-count/ascent-count.component';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { NgClass } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { TickButtonComponent } from '../../ascent/tick-button/tick-button.component';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { forkJoin, Observable, of } from 'rxjs';
import { Line } from '../../../models/line';
import { LoadingState } from '../../../enums/loading-state';
import { FormsModule } from '@angular/forms';
import { GradeRangeSliderComponent } from '../../shared/components/grade-range-slider/grade-range-slider.component';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { AccordionModule } from 'primeng/accordion';
import { map, mergeMap, take } from 'rxjs/operators';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';

import { TodoButtonComponent } from '../../todo/todo-button/todo-button.component';
import { IsTodoService } from '../../../services/crud/is-todo.service';
import { todoAdded } from '../../../ngrx/actions/todo.actions';
import { ClosedSpotTagComponent } from '../../shared/components/closed-spot-tag/closed-spot-tag.component';
import { ArchiveButtonComponent } from '../../archive/archive-button/archive-button.component';
import { GymModeDirective } from '../../shared/directives/gym-mode.directive';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';
import { AreasService } from '../../../services/crud/areas.service';
import { SectorsService } from '../../../services/crud/sectors.service';
import { CragsService } from '../../../services/crud/crags.service';
import { RegionService } from '../../../services/crud/region.service';
import { GradeDistribution } from '../../../models/scale';
import { Select } from 'primeng/select';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { LineListSkeletonComponent } from '../line-list-skeleton/line-list-skeleton.component';
import { Message } from 'primeng/message';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { LineBoolPropListComponent } from '../line-bool-prop-list/line-bool-prop-list.component';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { TopoImageComponent } from '../../shared/components/topo-image/topo-image.component';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../../services/core/language.service';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  LineAdvancedFiltersDialogComponent,
  type LineAdvancedFiltersDialogData,
} from '../line-advanced-filters-dialog/line-advanced-filters-dialog.component';
import {
  advancedLineListFiltersActive,
  defaultLineListAdvancedFilters,
  defaultLineListScaleKey,
  LineListAdvancedFilters,
  LineListFiltersDialogResult,
  LineListFiltersPersisted,
  sanitizeLineListAdvancedFilters,
} from '../line-list-filters/line-list-filter.logic';
import { appendLineListQueryParams } from '../line-list-filters/line-list-api-query';
import { ApiQueryParams } from '../../../utility/http/query-params';
import {
  loadLineListFilters,
  saveLineListFilters,
} from '../line-list-filters/line-list-filters.storage';

@Component({
  selector: 'lc-line-list',
  imports: [
    AscentCountComponent,
    ButtonModule,
    DataViewModule,
    HasPermissionDirective,
    RatingModule,
    RouterLink,
    SecretSpotTagComponent,
    TickButtonComponent,
    TranslocoDirective,
    NgClass,
    FormsModule,
    GradeRangeSliderComponent,
    AccordionModule,
    TodoButtonComponent,
    ClosedSpotTagComponent,
    ArchiveButtonComponent,
    GymModeDirective,
    Select,
    InfiniteScrollDirective,
    LineListSkeletonComponent,
    Message,
    SanitizeHtmlPipe,
    LineBoolPropListComponent,
    LineGradePipe,
    TopoImageComponent,
  ],
  providers: [ConfirmationService, DialogService],
  templateUrl: './line-list.component.html',
  styleUrl: './line-list.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LineListComponent implements OnInit {
  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public lines: Line[];
  public isMobile$: Observable<boolean>;
  public cragSlug: string;
  public sectorSlug: string;
  public areaSlug: string;
  public hasNextPage = true;
  public currentPage = 0;
  public ticks: Set<string> = new Set();
  public isTodo: Set<string> = new Set();
  public displayUserRating?: boolean = undefined;

  public availableScales: SelectItem<
    { lineType: LineType; gradeScale: string } | undefined
  >[] = [];
  public scaleKey: SelectItem<
    { lineType: LineType; gradeScale: string } | undefined
  >;

  public minGradeValue = -2;
  public maxGradeValue = null;
  public gradeScaleBoundsLoading = false;
  public gradeFilterRange: (number | null)[] = [
    this.minGradeValue,
    this.maxGradeValue,
  ];
  public orderOptions: SelectItem[];
  public orderKey: SelectItem;
  public orderDirectionOptions: SelectItem[];
  public orderDirectionKey: SelectItem;
  public showArchive = false;
  public advancedFilters: LineListAdvancedFilters =
    defaultLineListAdvancedFilters();
  public ref: DynamicDialogRef | undefined;

  private loadedGradeFilterRange: (number | null)[] | null = null;
  private destroyRef = inject(DestroyRef);
  private linesService = inject(LinesService);
  private areasService = inject(AreasService);
  private sectorsService = inject(SectorsService);
  private cragsService = inject(CragsService);
  private regionService = inject(RegionService);
  private store = inject(Store);
  private ticksService = inject(TicksService);
  private isTodoService = inject(IsTodoService);
  private route = inject(ActivatedRoute);
  private actions$ = inject(Actions);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private dialogService = inject(DialogService);

  protected scalesService = inject(ScalesService);

  ngOnInit() {
    this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
    this.sectorSlug =
      this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.parent.parent.snapshot.paramMap.get('area-slug');

    this.applyStoredAdvancedFilters();

    // Only offer lineType/gradeScales for filtering that are indeed available
    let gradeDistributionObserver: Observable<GradeDistribution>;
    if (this.areaSlug) {
      gradeDistributionObserver = this.areasService.getAreaGrades(
        this.areaSlug,
      );
    } else if (this.sectorSlug) {
      gradeDistributionObserver = this.sectorsService.getSectorGrades(
        this.sectorSlug,
      );
    } else if (this.cragSlug) {
      gradeDistributionObserver = this.cragsService.getCragGrades(
        this.cragSlug,
      );
    } else {
      gradeDistributionObserver = this.regionService.getRegionGrades();
    }
    gradeDistributionObserver.subscribe((gradeDistribution) => {
      this.availableScales = [];
      this.buildAvailableScales(gradeDistribution);
      this.applyPersistedGradeState(loadLineListFilters(), () =>
        this.loadFirstPage(),
      );
    });

    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.displayUserRating = instanceSettings.displayUserRatings;
      });
    this.buildOrderOptions();
    this.languageService.renderedLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rendered) => {
        if (!rendered) return;
        this.buildOrderOptions();
        this.buildAvailableScalesFromCurrent();
      });
    this.actions$
      .pipe(ofType(reloadAfterAscent), takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        this.ticks.add(action.ascendedLineId);
        if (this.advancedFilters.climbState !== 'any') {
          this.loadFirstPage();
        }
      });
    this.actions$
      .pipe(ofType(todoAdded), takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        this.isTodo.add(action.todoLineId);
      });
  }

  toggleArchive() {
    this.showArchive = !this.showArchive;
    this.loadFirstPage();
  }

  selectScale() {
    if (this.scaleKey?.value) {
      this.gradeScaleBoundsLoading = true;
      this.scalesService
        .getScale(this.scaleKey.value.lineType, this.scaleKey.value.gradeScale)
        .subscribe((scale) => {
          this.maxGradeValue = Math.max(
            ...scale.grades.map((grade) => grade.value),
          );
          this.gradeFilterRange = [-2, this.maxGradeValue];
          this.loadedGradeFilterRange = [...this.gradeFilterRange];
          this.gradeScaleBoundsLoading = false;
          this.persistLineListFilters();
          this.loadFirstPage();
        });
    } else {
      this.gradeScaleBoundsLoading = false;
      this.maxGradeValue = null;
      this.gradeFilterRange = [-2, null];
      this.loadedGradeFilterRange = [...this.gradeFilterRange];
      this.persistLineListFilters();
      this.loadFirstPage();
    }
  }

  reloadOnSlideEnd() {
    const lo = this.gradeFilterRange[0];
    const hi = this.gradeFilterRange[1];
    const prev = this.loadedGradeFilterRange;
    const changed = !prev || prev[0] !== lo || prev[1] !== hi;
    if (changed) {
      this.persistLineListFilters();
      this.loadFirstPage();
    }
  }

  filtersMayHideLines(): boolean {
    return advancedLineListFiltersActive(this.advancedFilters);
  }

  openAdvancedFiltersDialog() {
    const data: LineAdvancedFiltersDialogData = {
      initial: this.advancedFilters,
      availableScales: this.availableScales,
      scaleKey: this.scaleKey,
      gradeFilterRange: [...this.gradeFilterRange],
      maxGradeValue: this.maxGradeValue,
    };
    this.ref = this.dialogService.open(LineAdvancedFiltersDialogComponent, {
      modal: true,
      width: 'min(640px, 95vw)',
      header: this.translocoService.translate(
        'line.lineList.advancedFiltersDialogTitle',
      ),
      data,
    });
    this.ref.onClose
      .pipe(take(1))
      .subscribe((result: LineListFiltersDialogResult | undefined) => {
        if (result) {
          this.advancedFilters = sanitizeLineListAdvancedFilters(
            result.advanced,
          );
          const match = this.availableScales.find(
            (s) =>
              (s.value == null && result.scaleKey?.value == null) ||
              (s.value != null &&
                result.scaleKey?.value != null &&
                s.value.lineType === result.scaleKey.value.lineType &&
                s.value.gradeScale === result.scaleKey.value.gradeScale),
          );
          this.scaleKey = match ?? result.scaleKey;
          this.gradeFilterRange = [...result.gradeFilterRange];
          this.maxGradeValue = result.maxGradeValue;
          this.gradeScaleBoundsLoading = false;
          this.persistLineListFilters();
          this.loadFirstPage();
        }
      });
  }

  loadFirstPage() {
    this.currentPage = 0;
    this.hasNextPage = true;
    this.loadNextPage();
    this.loadedGradeFilterRange = [...this.gradeFilterRange];
  }

  loadNextPage() {
    if (
      this.loadingFirstPage !== LoadingState.LOADING &&
      this.loadingAdditionalPage !== LoadingState.LOADING &&
      this.hasNextPage
    ) {
      this.currentPage += 1;
      if (this.currentPage === 1) {
        this.loadingFirstPage = LoadingState.LOADING;
        this.lines = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      const params: ApiQueryParams = {
        page: this.currentPage,
        order_by: this.orderKey.value,
        order_direction: this.orderDirectionKey.value,
        per_page: 10,
      };
      if (this.showArchive) {
        params.archived = '1';
      }
      if (this.cragSlug) {
        params.crag_slug = this.cragSlug;
      }
      if (this.sectorSlug) {
        params.sector_slug = this.sectorSlug;
      }
      if (this.areaSlug) {
        params.area_slug = this.areaSlug;
      }
      appendLineListQueryParams(
        params,
        this.advancedFilters,
        this.scaleKey,
        this.gradeFilterRange,
      );
      this.linesService
        .getLines(params)
        .pipe(
          mergeMap((lines) => {
            const line_ids = lines.items.map((line) => line.id);
            const tickRequest =
              line_ids.length > 0
                ? this.ticksService.getTicks(null, null, null, line_ids)
                : of(new Set<string>());
            const isTodoRequest =
              line_ids.length > 0
                ? this.isTodoService.getIsTodo(null, null, null, line_ids)
                : of(new Set<string>());
            return forkJoin([tickRequest, isTodoRequest]).pipe(
              map(([ticks, isTodo]) => {
                this.lines.push(...lines.items);
                this.hasNextPage = lines.hasNext;
                this.loadingFirstPage = LoadingState.DEFAULT;
                this.loadingAdditionalPage = LoadingState.DEFAULT;
                this.ticks = new Set([...this.ticks, ...ticks]);
                this.isTodo = new Set([...this.isTodo, ...isTodo]);
              }),
            );
          }),
        )
        .subscribe();
    }
  }

  openVideo(event: MouseEvent, line: Line) {
    event.preventDefault();
    event.stopPropagation();
    if (line.videos.length > 0) {
      window.open(line.videos[0].url);
    }
  }

  private buildAvailableScales(gradeDistribution: GradeDistribution) {
    this.availableScales.push({
      label: this.translocoService.translate('ALL'),
      value: undefined,
    });
    for (const lineType in gradeDistribution) {
      for (const gradeScale in gradeDistribution[lineType]) {
        if (gradeDistribution[lineType][gradeScale]) {
          this.availableScales.push({
            label: `${this.translocoService.translate(lineType)} ${gradeScale}`,
            value: { lineType: lineType as LineType, gradeScale },
          });
        }
      }
    }
    this.scaleKey = defaultLineListScaleKey(this.availableScales);
  }

  private buildAvailableScalesFromCurrent() {
    // Recompute availableScales labels in-place when language changes.
    this.availableScales = this.availableScales.map((s) => {
      if (!s.value)
        return {
          label: this.translocoService.translate('ALL'),
          value: undefined,
        };
      const v = s.value as { lineType: LineType; gradeScale: string };
      return {
        label: `${this.translocoService.translate(v.lineType)} ${v.gradeScale}`,
        value: v,
      };
    });
    this.scaleKey =
      this.availableScales.find((s) => s.value === this.scaleKey?.value) ||
      defaultLineListScaleKey(this.availableScales);
  }

  private buildOrderOptions() {
    this.orderOptions = [
      {
        label: this.translocoService.translate(marker('orderByGrade')),
        value: 'grade_value',
      },
      {
        label: this.translocoService.translate(marker('orderByName')),
        value: 'name',
      },
      {
        label: this.translocoService.translate(marker('orderByTopoPosition')),
        value: 'topo_position',
      },
      {
        label: this.translocoService.translate(marker('orderByRating')),
        value: 'rating',
      },
      {
        label: this.translocoService.translate(marker('orderByAscentCount')),
        value: 'ascent_count',
      },
      {
        label: this.translocoService.translate(marker('orderByTimeCreated')),
        value: 'time_created',
      },
    ];
    this.orderKey = this.orderOptions[0];
    this.orderDirectionOptions = [
      {
        label: this.translocoService.translate(marker('orderDescending')),
        value: 'desc',
      },
      {
        label: this.translocoService.translate(marker('orderAscending')),
        value: 'asc',
      },
    ];
    this.orderDirectionKey = this.orderDirectionOptions[0];
  }

  private applyStoredAdvancedFilters(): void {
    const persisted = loadLineListFilters();
    this.advancedFilters = sanitizeLineListAdvancedFilters(
      persisted?.advanced ?? defaultLineListAdvancedFilters(),
    );
  }

  /**
   * Applies header grade filter state after `availableScales` is built on init.
   *
   * Restores scale selection and slider range from `persisted` when still valid for
   * this list, otherwise falls back to {@link defaultLineListScaleKey}. Fetches scale
   * bounds asynchronously when a concrete scale is selected so the slider can render.
   *
   * Syncs resolved state back to localStorage and sets `loadedGradeFilterRange` so
   * later slider moves are only persisted when the range actually changes.
   *
   * @param persisted Saved filters from {@link loadLineListFilters}, or null.
   * @param onReady Called once grade state is ready (e.g. to load the first page).
   */
  private applyPersistedGradeState(
    persisted: ReturnType<typeof loadLineListFilters>,
    onReady: () => void,
  ): void {
    // Nothing to filter by when this crag/sector/area has no grade distribution.
    const defaultScale = defaultLineListScaleKey(this.availableScales);
    if (!defaultScale) {
      onReady();
      return;
    }
    this.scaleKey = defaultScale;

    // Prefer the scale from localStorage if it still exists in this list's options.
    if (persisted?.grade?.scale) {
      const match = this.availableScales.find(
        (s) =>
          s.value?.lineType === persisted.grade.scale.lineType &&
          s.value?.gradeScale === persisted.grade.scale.gradeScale,
      );
      if (match) {
        this.scaleKey = match;
      }
    }

    if (this.scaleKey?.value) {
      // Concrete scale: load max grade for the slider, then restore or default the range.
      this.gradeScaleBoundsLoading = true;
      this.scalesService
        .getScale(this.scaleKey.value.lineType, this.scaleKey.value.gradeScale)
        .subscribe((scale) => {
          this.maxGradeValue = Math.max(
            ...scale.grades.map((grade) => grade.value),
          );
          if (
            persisted?.grade?.range?.length === 2 &&
            typeof persisted.grade.range[0] === 'number' &&
            typeof persisted.grade.range[1] === 'number'
          ) {
            // Clamp stored range to current scale bounds (list context may have changed).
            this.gradeFilterRange = [
              Math.max(
                -2,
                Math.min(persisted.grade.range[0], this.maxGradeValue),
              ),
              Math.max(
                -2,
                Math.min(persisted.grade.range[1], this.maxGradeValue),
              ),
            ];
          } else {
            this.gradeFilterRange = [-2, this.maxGradeValue];
          }
          this.loadedGradeFilterRange = [...this.gradeFilterRange];
          this.gradeScaleBoundsLoading = false;
          this.persistLineListFilters();
          onReady();
        });
    } else {
      // "ALL" scale: no slider bounds; grade range is not sent to the API.
      this.gradeScaleBoundsLoading = false;
      this.maxGradeValue = null;
      this.gradeFilterRange = [-2, null];
      this.loadedGradeFilterRange = [...this.gradeFilterRange];
      this.persistLineListFilters();
      onReady();
    }
  }

  private persistLineListFilters(): void {
    const lo = Number(this.gradeFilterRange[0] ?? -2);
    const hi = this.gradeFilterRange[1];
    const hiNum = typeof hi === 'number' ? hi : lo;
    const payload: LineListFiltersPersisted = {
      advanced: this.advancedFilters,
      grade: {
        scale: this.scaleKey?.value
          ? {
              lineType: this.scaleKey.value.lineType,
              gradeScale: this.scaleKey.value.gradeScale,
            }
          : null,
        range: [lo, hiNum],
      },
    };
    saveLineListFilters(payload);
  }

  protected readonly LineType = LineType;
}
