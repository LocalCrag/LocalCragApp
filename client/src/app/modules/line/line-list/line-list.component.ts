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
import { AsyncPipe, NgClass } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { TickButtonComponent } from '../../ascent/tick-button/tick-button.component';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { forkJoin, Observable, of } from 'rxjs';
import { Line } from '../../../models/line';
import { LoadingState } from '../../../enums/loading-state';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { SliderLabelsComponent } from '../../shared/components/slider-labels/slider-labels.component';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { AccordionModule } from 'primeng/accordion';
import { map, mergeMap } from 'rxjs/operators';
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
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
    SliderModule,
    SliderLabelsComponent,
    AccordionModule,
    TodoButtonComponent,
    ClosedSpotTagComponent,
    ArchiveButtonComponent,
    GymModeDirective,
    AsyncPipe,
    Select,
    InfiniteScrollDirective,
    LineListSkeletonComponent,
    Message,
    SanitizeHtmlPipe,
    LineBoolPropListComponent,
    LineGradePipe,
    TopoImageComponent,
    TranslateSpecialGradesPipe,
  ],
  providers: [ConfirmationService],
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
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue];
  public orderOptions: SelectItem[];
  public orderKey: SelectItem;
  public orderDirectionOptions: SelectItem[];
  public orderDirectionKey: SelectItem;
  public showArchive = false;

  private loadedGradeFilterRange: number[] = null;
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

  protected scalesService = inject(ScalesService);

  ngOnInit() {
    this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
    this.sectorSlug =
      this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.parent.parent.snapshot.paramMap.get('area-slug');

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
      if (this.availableScales.length <= 2) {
        this.scaleKey = this.availableScales[1]; // Default: Select first scale, so range slider is available
      } else {
        this.scaleKey = this.availableScales[0]; // Default: Select "ALL" if multiple scales are available
      }
      this.selectScale(); // Calls loadFirstPage()
    });

    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettings) => {
        this.displayUserRating = instanceSettings.displayUserRatings;
      });
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
        label: this.translocoService.translate(marker('orderByRating')),
        value: 'rating',
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
    this.actions$
      .pipe(ofType(reloadAfterAscent), takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        this.ticks.add(action.ascendedLineId);
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
      this.scalesService
        .getScale(this.scaleKey.value.lineType, this.scaleKey.value.gradeScale)
        .subscribe((scale) => {
          this.maxGradeValue = Math.max(
            ...scale.grades.map((grade) => grade.value),
          );
          this.gradeFilterRange = [-2, this.maxGradeValue];
        });
    }
    this.loadFirstPage();
  }

  reloadOnSlideEnd() {
    if (
      !this.loadedGradeFilterRange ||
      this.gradeFilterRange[0] !== this.loadedGradeFilterRange[0] ||
      this.gradeFilterRange[1] !== this.loadedGradeFilterRange[1]
    ) {
      this.loadFirstPage();
    }
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
      const filters = new URLSearchParams();
      filters.set('page', this.currentPage.toString());
      if (this.showArchive) {
        filters.set('archived', '1');
      }
      if (this.cragSlug) {
        filters.set('crag_slug', this.cragSlug);
      }
      if (this.sectorSlug) {
        filters.set('sector_slug', this.sectorSlug);
      }
      if (this.areaSlug) {
        filters.set('area_slug', this.areaSlug);
      }
      if (this.scaleKey?.value) {
        filters.set('line_type', this.scaleKey.value.lineType);
        filters.set('grade_scale', this.scaleKey.value.gradeScale);
      }
      if (this.gradeFilterRange[1] !== null) {
        filters.set('min_grade', this.gradeFilterRange[0].toString());
        filters.set('max_grade', this.gradeFilterRange[1].toString());
      }
      filters.set('order_by', this.orderKey.value);
      filters.set('order_direction', this.orderDirectionKey.value);
      filters.set('per_page', '10');
      const filterString = `?${filters.toString()}`;
      this.linesService
        .getLines(filterString)
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

  protected readonly LineType = LineType;
}
