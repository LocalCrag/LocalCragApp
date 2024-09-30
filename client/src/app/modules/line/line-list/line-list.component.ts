import {Component, HostListener, OnInit, ViewEncapsulation,} from '@angular/core';
import {LinesService} from '../../../services/crud/lines.service';
import {select, Store} from '@ngrx/store';
import {Actions, ofType} from '@ngrx/effects';
import {TicksService} from '../../../services/crud/ticks.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {TranslocoDirective, TranslocoPipe, TranslocoService,} from '@jsverse/transloco';
import {AscentCountComponent} from '../../ascent/ascent-count/ascent-count.component';
import {ButtonModule} from 'primeng/button';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {HasPermissionDirective} from '../../shared/directives/has-permission.directive';
import {LineModule} from '../line.module';
import {NgClass, NgForOf, NgIf} from '@angular/common';
import {RatingModule} from 'primeng/rating';
import {SecretSpotTagComponent} from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import {TickButtonComponent} from '../../ascent/tick-button/tick-button.component';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {forkJoin, Observable, of} from 'rxjs';
import {SharedModule} from '../../shared/shared.module';
import {Line} from '../../../models/line';
import {LoadingState} from '../../../enums/loading-state';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {FormsModule} from '@angular/forms';
import {SliderModule} from 'primeng/slider';
import {gradeNameByValue, GRADES} from '../../../utility/misc/grades';
import {SliderLabelsComponent} from '../../shared/components/slider-labels/slider-labels.component';
import {SelectItem} from 'primeng/api';
import {marker} from '@jsverse/transloco-keys-manager/marker';
import {AccordionModule} from 'primeng/accordion';
import {map, mergeMap} from 'rxjs/operators';
import {reloadAfterAscent} from '../../../ngrx/actions/ascent.actions';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {TodoButtonComponent} from '../../todo/todo-button/todo-button.component';
import {IsTodoService} from '../../../services/crud/is-todo.service';
import {todoAdded} from '../../../ngrx/actions/todo.actions';
import {ArchiveButtonComponent} from "../../archive/archive-button/archive-button.component";

@Component({
  selector: 'lc-line-list',
  standalone: true,
  imports: [
    AscentCountComponent,
    ButtonModule,
    DataViewModule,
    DropdownModule,
    HasPermissionDirective,
    LineModule,
    NgForOf,
    NgIf,
    RatingModule,
    RouterLink,
    SecretSpotTagComponent,
    SharedModule,
    TickButtonComponent,
    TranslocoDirective,
    TranslocoPipe,
    InfiniteScrollModule,
    NgClass,
    FormsModule,
    SliderModule,
    SliderLabelsComponent,
    AccordionModule,
    TodoButtonComponent,
    ArchiveButtonComponent,
  ],
  templateUrl: './line-list.component.html',
  styleUrl: './line-list.component.scss',
  encapsulation: ViewEncapsulation.None,
})
@UntilDestroy()
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

  public minGradeValue = GRADES['FB'][0].value;
  public maxGradeValue = GRADES['FB'].at(-1).value;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue];
  public orderOptions: SelectItem[];
  public orderKey: SelectItem;
  public orderDirectionOptions: SelectItem[];
  public orderDirectionKey: SelectItem;
  public listenForSliderStop = false;

  constructor(
    private linesService: LinesService,
    private store: Store,
    private ticksService: TicksService,
    private isTodoService: IsTodoService,
    private route: ActivatedRoute,
    private actions$: Actions,
    private translocoService: TranslocoService,
  ) {}

  ngOnInit() {
    this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
    this.sectorSlug =
      this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.parent.parent.snapshot.paramMap.get('area-slug');
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
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
    this.loadFirstPage();
    this.actions$
      .pipe(ofType(reloadAfterAscent), untilDestroyed(this))
      .subscribe((action) => {
        this.ticks.add(action.ascendedLineId);
      });
    this.actions$
      .pipe(ofType(todoAdded), untilDestroyed(this))
      .subscribe((action) => {
        this.isTodo.add(action.todoLineId);
      });
  }

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  reloadAfterSliderStop() {
    if (this.listenForSliderStop) {
      this.loadFirstPage();
    }
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
        this.lines = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      let filters = [`page=${this.currentPage}`];
      if (this.cragSlug) {
        filters.push(`crag_slug=${this.cragSlug}`);
      }
      if (this.sectorSlug) {
        filters.push(`sector_slug=${this.sectorSlug}`);
      }
      if (this.areaSlug) {
        filters.push(`area_slug=${this.areaSlug}`);
      }
      filters.push(`min_grade=${this.gradeFilterRange[0]}`);
      filters.push(`max_grade=${this.gradeFilterRange[1]}`);
      filters.push(`order_by=${this.orderKey.value}`);
      filters.push(`order_direction=${this.orderDirectionKey.value}`);
      filters.push(`per_page=10`);
      const filterString = `?${filters.join('&')}`;
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

  protected readonly gradeNameByValue = gradeNameByValue;
}
