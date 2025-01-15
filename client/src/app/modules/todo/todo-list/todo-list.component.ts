import {
  Component,
  HostListener,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { SelectItem } from 'primeng/api';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import {
  TranslocoDirective,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Todo } from '../../../models/todo';
import { TodosService } from '../../../services/crud/todos.service';
import { todoAdded } from '../../../ngrx/actions/todo.actions';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { DataViewModule } from 'primeng/dataview';
import { DropdownModule } from 'primeng/dropdown';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MenuModule } from 'primeng/menu';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { RatingModule } from 'primeng/rating';
import { RouterLink } from '@angular/router';
import { SliderLabelsComponent } from '../../shared/components/slider-labels/slider-labels.component';
import { SliderModule } from 'primeng/slider';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { TodoPriorityButtonComponent } from '../todo-priority-button/todo-priority-button.component';
import { TickButtonComponent } from '../../ascent/tick-button/tick-button.component';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { Crag } from '../../../models/crag';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';
import { SharedModule } from '../../shared/shared.module';
import { RegionService } from '../../../services/crud/region.service';

@Component({
  selector: 'lc-todo-list',
  standalone: true,
  imports: [
    AvatarModule,
    ButtonModule,
    ConfirmPopupModule,
    DataViewModule,
    DropdownModule,
    InfiniteScrollModule,
    MenuModule,
    NgForOf,
    NgIf,
    RatingModule,
    RouterLink,
    SliderLabelsComponent,
    SliderModule,
    TagModule,
    TranslocoDirective,
    FormsModule,
    NgClass,
    CardModule,
    TodoPriorityButtonComponent,
    TickButtonComponent,
    AsyncPipe,
    SharedModule,
  ],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
  encapsulation: ViewEncapsulation.None,
})
@UntilDestroy()
export class TodoListComponent implements OnInit {
  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public todos: Todo[];
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;

  public availableScales: SelectItem<{lineType: LineType, gradeScale: string} | undefined>[] = [];
  public scaleKey: SelectItem<{lineType: LineType, gradeScale: string} | undefined>;

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
  public listenForSliderStop = false;
  public crags: Crag[] = [];

  constructor(
    private todosService: TodosService,
    private store: Store,
    private menuItemsService: MenuItemsService,
    private actions$: Actions,
    private translocoService: TranslocoService,
    private regionService: RegionService,
    protected scalesService: ScalesService,
  ) {}

  ngOnInit() {
    // Only offer lineType/gradeScales for filtering that are indeed available
    this.regionService.getRegionGrades().subscribe((gradeDistribution) => {
      this.availableScales.push({
        label: this.translocoService.translate("ALL"),
        value: undefined,
      });
      for (const lineType in gradeDistribution) {
        for (const gradeScale in gradeDistribution[lineType]) {
          if (gradeDistribution[lineType][gradeScale]) {
            this.availableScales.push({
              label: `${this.translocoService.translate(lineType)} ${gradeScale}`,
              value: { lineType: lineType as LineType, gradeScale }
            });
          }
        }
      }
      if (this.availableScales.length <= 2) {
        this.scaleKey = this.availableScales[1];  // Default: Select first scale, so range slider is available
      } else {
        this.scaleKey = this.availableScales[0];  // Default: Select "ALL" if multiple scales are available
      }
      this.selectScale();
    });

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
    this.loadFirstPage();
    this.actions$
      .pipe(ofType(todoAdded, reloadAfterAscent), untilDestroyed(this))
      .subscribe(() => {
        this.loadFirstPage();
      });
    this.menuItemsService.getCragMenuStructure().subscribe((crags) => {
      this.crags = crags;
      this.buildCragFilterOptions();
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

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  reloadAfterSliderStop() {
    if (this.listenForSliderStop) {
      this.loadFirstPage();
    }
  }

  deleteTodo(todo: Todo) {
    this.todosService.deleteTodo(todo).subscribe(() => {
      this.store.dispatch(
        toastNotification(NotificationIdentifier.TODO_DELETED),
      );
      this.todos = this.todos.filter((t) => t.id !== todo.id);
    });
  }

  selectScale() {
    if (this.scaleKey?.value) {
      this.scalesService.getScale(this.scaleKey.value.lineType, this.scaleKey.value.gradeScale).subscribe((scale) => {
        this.maxGradeValue = Math.max(...scale.grades.map(grade => grade.value));
        this.gradeFilterRange = [-2, this.maxGradeValue];
      });
    }
    this.loadFirstPage();
  }

  loadFirstPage() {
    this.listenForSliderStop = false;
    this.currentPage = 0;
    this.hasNextPage = true;
    this.loadNextPage();
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
        this.todos = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      const filters = new URLSearchParams();
      filters.set("page", this.currentPage.toString());
      if (this.gradeFilterRange[1] !== null) {
        filters.set("min_grade", this.gradeFilterRange[0].toString());
        filters.set("max_grade", this.gradeFilterRange[1].toString());
      }
      if (this.scaleKey?.value) {
        filters.set("line_type", this.scaleKey.value.lineType);
        filters.set("grade_scale", this.scaleKey.value.gradeScale);
      }
      filters.set("order_by", this.orderKey.value);
      filters.set("order_direction", this.orderDirectionKey.value);
      filters.set("per_page", "10");
      if (this.cragFilterKey?.value) {
        filters.set("crag_id", this.cragFilterKey.value);
      }
      if (this.sectorFilterKey?.value) {
        filters.set("sector_id", this.sectorFilterKey.value);
      }
      if (this.areaFilterKey?.value) {
        filters.set("area_id", this.areaFilterKey.value);
      }
      if (this.priorityFilterKey.value !== null) {
        filters.set("priority", this.priorityFilterKey.value);
      }
      const filterString = `?${filters.toString()}`;
      this.todosService.getTodos(filterString).subscribe((todos) => {
        this.todos.push(...todos.items);
        this.hasNextPage = todos.hasNext;
        this.loadingFirstPage = LoadingState.DEFAULT;
        this.loadingAdditionalPage = LoadingState.DEFAULT;
      });
    }
  }

  protected readonly LineType = LineType;
}
