import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectItem } from 'primeng/api';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

import { Todo } from '../../../models/todo';
import { TodosService } from '../../../services/crud/todos.service';
import { ApiQueryParams } from '../../../utility/http/query-params';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DataViewModule } from 'primeng/dataview';
import { MenuModule } from 'primeng/menu';
import { NgClass } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GradeRangeSliderComponent } from '../../shared/components/grade-range-slider/grade-range-slider.component';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { TodoPriorityButtonComponent } from '../todo-priority-button/todo-priority-button.component';
import { TickButtonComponent } from '../../ascent/tick-button/tick-button.component';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { Crag } from '../../../models/crag';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { todoAdded } from '../../../ngrx/actions/todo.actions';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';
import { RegionService } from '../../../services/crud/region.service';
import { Select } from 'primeng/select';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { LineListSkeletonComponent } from '../../line/line-list-skeleton/line-list-skeleton.component';
import { Message } from 'primeng/message';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '../../../services/core/language.service';

@Component({
  selector: 'lc-todo-list',
  imports: [
    AvatarModule,
    ButtonModule,
    ConfirmPopupModule,
    DataViewModule,
    MenuModule,
    RatingModule,
    RouterLink,
    GradeRangeSliderComponent,
    TagModule,
    TranslocoDirective,
    FormsModule,
    NgClass,
    CardModule,
    TodoPriorityButtonComponent,
    TickButtonComponent,
    Select,
    InfiniteScrollDirective,
    LineListSkeletonComponent,
    Message,
    LineGradePipe,
  ],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent implements OnInit, PaginatedListView {
  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.DEFAULT;
  public todos: Todo[];
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;

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
  public priorityFilterOptions: SelectItem[];
  public priorityFilterKey: SelectItem;
  public cragFilterOptions: SelectItem[];
  public cragFilterKey: SelectItem;
  public sectorFilterOptions: SelectItem[];
  public sectorFilterKey: SelectItem;
  public areaFilterOptions: SelectItem[];
  public areaFilterKey: SelectItem;
  public crags: Crag[] = [];

  private loadedGradeFilterRange: number[] = null;
  private destroyRef = inject(DestroyRef);
  private todosService = inject(TodosService);
  private store = inject(Store);
  private menuItemsService = inject(MenuItemsService);
  private actions$ = inject(Actions);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private regionService = inject(RegionService);
  private cdr = inject(ChangeDetectorRef);

  protected scalesService = inject(ScalesService);

  ngOnInit() {
    // Only offer lineType/gradeScales for filtering that are indeed available
    this.regionService.getRegionGrades().subscribe((gradeDistribution) => {
      this.buildAvailableScales(gradeDistribution);
      // Rebuild labels on language change
      this.languageService.renderedLanguage$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((rendered) => {
          if (!rendered) return;
          this.buildAvailableScalesFromCurrent();
          this.buildPriorityFilterOptions();
          this.buildOrderOptions();
          this.buildCragFilterOptions();
          this.cdr.markForCheck();
        });
      this.selectScale(); // Calls loadFirstPage()
    });

    this.buildOrderOptions();
    this.buildPriorityFilterOptions();

    this.menuItemsService.getCragMenuStructure().subscribe((crags) => {
      this.crags = crags;
      this.buildCragFilterOptions();
      // Recompute crag/sector/area filter labels when language changes
      this.languageService.renderedLanguage$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((rendered) => {
          if (!rendered) return;
          this.buildCragFilterOptions();
          if (this.cragFilterKey?.value) this.buildSectorFilterOptions();
          if (this.sectorFilterKey?.value) this.buildAreaFilterOptions();
          this.cdr.markForCheck();
        });
    });

    // Reload the list when relevant actions occur
    this.actions$
      .pipe(
        ofType(todoAdded, reloadAfterAscent),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.loadFirstPage();
      });
  }

  buildCragFilterOptions() {
    this.cragFilterOptions = [
      {
        label: this.translocoService.translate(marker('allCrags')),
        value: null,
      },
      ...this.crags.map((crag) => {
        return { label: crag.name, value: crag.id };
      }),
    ];
    this.cragFilterKey = this.cragFilterOptions[0];
  }

  private buildAvailableScales(gradeDistribution: any) {
    this.availableScales = [];
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
  }

  private buildAvailableScalesFromCurrent() {
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
      this.availableScales[0];
  }

  private buildOrderOptions() {
    this.orderOptions = [
      {
        label: this.translocoService.translate(marker('orderByGrade')),
        value: 'grade_value',
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

  private buildPriorityFilterOptions() {
    this.priorityFilterOptions = [
      {
        label: this.translocoService.translate(marker('allPriorities')),
        value: null,
      },
      {
        label: this.translocoService.translate(marker('highPriority')),
        value: 'HIGH',
      },
      {
        label: this.translocoService.translate(marker('mediumPriority')),
        value: 'MEDIUM',
      },
      {
        label: this.translocoService.translate(marker('lowPriority')),
        value: 'LOW',
      },
    ];
    this.priorityFilterKey = this.priorityFilterOptions[0];
  }

  buildSectorFilterOptions() {
    if (this.cragFilterKey.value) {
      this.sectorFilterOptions = [
        {
          label: this.translocoService.translate(marker('allSectors')),
          value: null,
        },
        ...this.crags
          .find((crag) => crag.id === this.cragFilterKey.value)
          .sectors.map((sector) => {
            return { label: sector.name, value: sector.id };
          }),
      ];
      this.sectorFilterKey = this.sectorFilterOptions[0];
    } else {
      this.sectorFilterOptions = null;
      this.sectorFilterKey = null;
    }
  }

  buildAreaFilterOptions() {
    if (this.sectorFilterKey.value) {
      this.areaFilterOptions = [
        {
          label: this.translocoService.translate(marker('allAreas')),
          value: null,
        },
        ...this.crags
          .find((crag) => crag.id === this.cragFilterKey.value)
          .sectors.find((sector) => sector.id === this.sectorFilterKey.value)
          .areas.map((area) => {
            return { label: area.name, value: area.id };
          }),
      ];
      this.areaFilterKey = this.areaFilterOptions[0];
    } else {
      this.areaFilterOptions = null;
      this.areaFilterKey = null;
    }
  }

  deleteTodo(todo: Todo) {
    this.todosService.deleteTodo(todo).subscribe(() => {
      this.store.dispatch(toastNotification('TODO_DELETED'));
      this.todos = this.todos.filter((t) => t.id !== todo.id);
      this.cdr.detectChanges();
    });
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
    loadFirstPaginatedPage(
      this,
      () => this.loadNextPage(),
      () => {
        this.loadedGradeFilterRange = [...this.gradeFilterRange];
      },
    );
  }

  loadNextPage() {
    const page = beginPaginatedPageLoad(this, () => {
      this.todos = [];
    });
    if (page === null) {
      return;
    }
    const params: ApiQueryParams = {
      page: this.currentPage,
      order_by: this.orderKey.value,
      order_direction: this.orderDirectionKey.value,
      per_page: 10,
    };
    if (this.gradeFilterRange[1] !== null) {
      params.min_grade = this.gradeFilterRange[0];
      params.max_grade = this.gradeFilterRange[1];
    }
    if (this.scaleKey?.value) {
      params.line_type = this.scaleKey.value.lineType;
      params.grade_scale = this.scaleKey.value.gradeScale;
    }
    if (this.cragFilterKey?.value) {
      params.crag_id = this.cragFilterKey.value;
    }
    if (this.sectorFilterKey?.value) {
      params.sector_id = this.sectorFilterKey.value;
    }
    if (this.areaFilterKey?.value) {
      params.area_id = this.areaFilterKey.value;
    }
    if (this.priorityFilterKey.value !== null) {
      params.priority = this.priorityFilterKey.value;
    }
    this.todosService.getTodos(params).subscribe((todos) => {
      this.todos.push(...todos.items);
      completePaginatedPageLoad(this, todos.hasNext);
      this.cdr.detectChanges();
    });
  }

  protected readonly LineType = LineType;
}
