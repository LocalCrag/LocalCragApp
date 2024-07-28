import {Component, HostListener, ViewEncapsulation} from '@angular/core';
import {LoadingState} from '../../../enums/loading-state';
import {Ascent} from '../../../models/ascent';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {GRADES, gradeNameByValue} from '../../../utility/misc/grades';
import {ConfirmationService, MenuItem, SelectItem, SharedModule} from 'primeng/api';
import {AscentsService} from '../../../services/crud/ascents.service';
import {Store} from '@ngrx/store';
import {Actions, ofType} from '@ngrx/effects';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {reloadAfterAscent} from '../../../ngrx/actions/ascent.actions';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {Todo} from '../../../models/todo';
import {TodosService} from '../../../services/crud/todos.service';
import {todoAdded} from '../../../ngrx/actions/todo.actions';
import {AvatarModule} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {ConsensusGradePipe} from '../../ascent/pipes/consensus-grade.pipe';
import {DataViewModule} from 'primeng/dataview';
import {DowngradePipe} from '../../ascent/pipes/downgrade.pipe';
import {DropdownModule} from 'primeng/dropdown';
import {HasPermissionDirective} from '../../shared/directives/has-permission.directive';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {MenuModule} from 'primeng/menu';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {RatingModule} from 'primeng/rating';
import {RouterLink} from '@angular/router';
import {SliderLabelsComponent} from '../../shared/components/slider-labels/slider-labels.component';
import {SliderModule} from 'primeng/slider';
import {TagModule} from 'primeng/tag';
import {UpgradePipe} from '../../ascent/pipes/upgrade.pipe';
import {FormsModule} from '@angular/forms';
import {CardModule} from 'primeng/card';
import {TodoPriorityButtonComponent} from '../todo-priority-button/todo-priority-button.component';
import {TickButtonComponent} from '../../ascent/tick-button/tick-button.component';
import {MenuItemsService} from '../../../services/crud/menu-items.service';
import {Crag} from '../../../models/crag';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';

@Component({
  selector: 'lc-todo-list',
  standalone: true,
  imports: [
    AvatarModule,
    ButtonModule,
    ConfirmPopupModule,
    ConsensusGradePipe,
    DataViewModule,
    DowngradePipe,
    DropdownModule,
    HasPermissionDirective,
    InfiniteScrollModule,
    MenuModule,
    NgForOf,
    NgIf,
    RatingModule,
    RouterLink,
    SharedModule,
    SharedModule,
    SliderLabelsComponent,
    SliderModule,
    TagModule,
    TranslocoDirective,
    TranslocoPipe,
    UpgradePipe,
    FormsModule,
    NgClass,
    CardModule,
    TodoPriorityButtonComponent,
    TickButtonComponent
  ],
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.scss',
  encapsulation: ViewEncapsulation.None
})
@UntilDestroy()
export class TodoListComponent {

  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public todos: Todo[];
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;
  public minGradeValue = GRADES['FB'][2].value; // Skip project grades
  public maxGradeValue = GRADES['FB'].at(-1).value;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue]
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

  constructor(private todosService: TodosService,
              private store: Store,
              private menuItemsService: MenuItemsService,
              private actions$: Actions,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.orderOptions = [
      {label: this.translocoService.translate(marker('orderByGrade')), value: 'grade_value'},
      {label: this.translocoService.translate(marker('orderByTimeCreated')), value: 'time_created'},
    ];
    this.orderKey = this.orderOptions[0];
    this.orderDirectionOptions = [
      {label: this.translocoService.translate(marker('orderDescending')), value: 'desc'},
      {label: this.translocoService.translate(marker('orderAscending')), value: 'asc'},
    ];
    this.orderDirectionKey = this.orderDirectionOptions[0];
    this.priorityFilterOptions = [
      {label: this.translocoService.translate(marker('allPriorities')), value: null},
      {label: this.translocoService.translate(marker('highPriority')), value: 'HIGH'},
      {label: this.translocoService.translate(marker('mediumPriority')), value: 'MEDIUM'},
      {label: this.translocoService.translate(marker('lowPriority')), value: 'LOW'},
    ];
    this.priorityFilterKey = this.priorityFilterOptions[0];
    this.loadFirstPage();
    this.actions$.pipe(ofType(todoAdded, reloadAfterAscent), untilDestroyed(this)).subscribe(() => {
      this.loadFirstPage();
    })
    this.menuItemsService.getCragMenuStructure().subscribe(crags => {
      this.crags = crags;
      this.buildCragFilterOptions();
    });
  }

  buildCragFilterOptions() {
    this.cragFilterOptions = [{
      label: this.translocoService.translate(marker('allCrags')),
      value: null
    }, ...this.crags.map(crag => {
      return {label: crag.name, value: crag.id};
    })];
    this.cragFilterKey = this.cragFilterOptions[0];
  }

  buildSectorFilterOptions() {
    if (this.cragFilterKey.value) {
      this.sectorFilterOptions = [{
        label: this.translocoService.translate(marker('allSectors')),
        value: null
      }, ...this.crags.find(crag => crag.id === this.cragFilterKey.value).sectors.map(sector => {
        return {label: sector.name, value: sector.id};
      })];
      this.sectorFilterKey = this.sectorFilterOptions[0];
    } else {
      this.sectorFilterOptions = null;
      this.sectorFilterKey = null;
    }
  }

  buildAreaFilterOptions() {
    if (this.sectorFilterKey.value) {
      this.areaFilterOptions = [{
        label: this.translocoService.translate(marker('allAreas')),
        value: null
      }, ...this.crags.find(crag => crag.id === this.cragFilterKey.value).sectors.find(sector => sector.id === this.sectorFilterKey.value).areas.map(area => {
        return {label: area.name, value: area.id};
      })];
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

  deleteTodo(todo: Todo){
    this.todosService.deleteTodo(todo).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.TODO_DELETED));
      this.todos = this.todos.filter(t => t.id !== todo.id);
    });
  }

  loadFirstPage() {
    this.listenForSliderStop = false;
    this.currentPage = 0;
    this.hasNextPage = true;
    this.loadNextPage();
  }

  loadNextPage() {
    if (this.loadingFirstPage !== LoadingState.LOADING && this.loadingAdditionalPage !== LoadingState.LOADING && this.hasNextPage) {
      this.currentPage += 1;
      if (this.currentPage === 1) {
        this.loadingFirstPage = LoadingState.LOADING
        this.todos = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      let filters = [`page=${this.currentPage}`]
      filters.push(`min_grade=${this.gradeFilterRange[0]}`);
      filters.push(`max_grade=${this.gradeFilterRange[1]}`);
      filters.push(`order_by=${this.orderKey.value}`);
      filters.push(`order_direction=${this.orderDirectionKey.value}`);
      filters.push(`per_page=10`);
      if (this.cragFilterKey?.value) {
        filters.push(`crag_id=${this.cragFilterKey.value}`);
      }
      if (this.sectorFilterKey?.value) {
        filters.push(`sector_id=${this.sectorFilterKey.value}`);
      }
      if (this.areaFilterKey?.value) {
        filters.push(`area_id=${this.areaFilterKey.value}`);
      }
      if (this.priorityFilterKey.value !== null) {
        filters.push(`priority=${this.priorityFilterKey.value}`);
      }
      const filterString = `?${filters.join('&')}`;
      this.todosService.getTodos(filterString).subscribe(todos => {
        this.todos.push(...todos.items);
        this.hasNextPage = todos.hasNext;
        this.loadingFirstPage = LoadingState.DEFAULT;
        this.loadingAdditionalPage = LoadingState.DEFAULT;
      });
    }
  }

  protected readonly
  gradeNameByValue = gradeNameByValue;

}
