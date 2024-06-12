import {Component, HostListener, OnInit, ViewEncapsulation} from '@angular/core';
import {LinesService} from '../../../services/crud/lines.service';
import {select, Store} from '@ngrx/store';
import {Actions} from '@ngrx/effects';
import {TicksService} from '../../../services/crud/ticks.service';
import {ActivatedRoute, RouterLink} from '@angular/router';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@ngneat/transloco';
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
import {Observable} from 'rxjs';
import {SharedModule} from '../../shared/shared.module';
import {Line} from '../../../models/line';
import {LoadingState} from '../../../enums/loading-state';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {FormsModule} from '@angular/forms';
import {SliderModule} from 'primeng/slider';
import {gradeNameByValue, GRADES} from '../../../utility/misc/grades';
import {SliderLabelsComponent} from '../../shared/components/slider-labels/slider-labels.component';
import {PrimeIcons, SelectItem} from 'primeng/api';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {AccordionModule} from 'primeng/accordion';

@Component({
  selector: 'lc-line-list-new',
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
    AccordionModule
  ],
  templateUrl: './line-list-new.component.html',
  styleUrl: './line-list-new.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class LineListNewComponent implements OnInit{

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
  public ticks: Set<string> = new Set(); // TODO load ticks

  public minGradeValue = GRADES['FB'][0].value;
  public maxGradeValue = GRADES['FB'].at(-1).value;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue]
  public orderOptions: SelectItem[];
  public orderKey: SelectItem;
  public orderDirectionOptions: SelectItem[];
  public orderDirectionKey: SelectItem;

  public listenForSliderStop = false;


  constructor(private linesService: LinesService,
              private store: Store,
              private actions$: Actions,
              private ticksService: TicksService,
              private route: ActivatedRoute,
              private translocoService: TranslocoService) {
  }

  ngOnInit() {
    this.cragSlug = this.route.parent.parent.snapshot.paramMap.get('crag-slug');
    this.sectorSlug = this.route.parent.parent.snapshot.paramMap.get('sector-slug');
    this.areaSlug = this.route.parent.parent.snapshot.paramMap.get('area-slug');
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.orderOptions = [
      {label: this.translocoService.translate(marker('orderByName')), value: 'name'},
      {label: this.translocoService.translate(marker('orderByGrade')), value: 'grade_value'},
      {label: this.translocoService.translate(marker('orderByRating')), value: 'rating'},
    ];
    this.orderKey = this.orderOptions[0];
    this.orderDirectionOptions = [
      {label: this.translocoService.translate(marker('orderAscending')), value: 'asc'},
      {label: this.translocoService.translate(marker('orderDescending')), value: 'desc'},
    ];
    this.orderDirectionKey = this.orderDirectionOptions[0];
    this.loadFirstPage();
  }

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  reloadAfterSliderStop() {
    if(this.listenForSliderStop){
      this.loadFirstPage();
    }
  }

  loadFirstPage(){
    this.listenForSliderStop = false;
    this.currentPage = 0;
    this.hasNextPage = true;
    this.loadNextPage();
  }

  loadNextPage(){
    if(this.loadingFirstPage !== LoadingState.LOADING &&this.loadingAdditionalPage !== LoadingState.LOADING && this.hasNextPage) {
      this.currentPage += 1;
      if(this.currentPage === 1){
        this.loadingFirstPage = LoadingState.LOADING
        this.lines = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      let filters = [`page=${this.currentPage}`]
      filters.push(`min_grade=${this.gradeFilterRange[0]}`);
      filters.push(`max_grade=${this.gradeFilterRange[1]}`);
      filters.push(`order_by=${this.orderKey.value}`);
      filters.push(`order_direction=${this.orderDirectionKey.value}`);
      const filterString = `?${filters.join('&')}`;
      this.linesService.getLinesNew(filterString).subscribe(lines => {
        this.lines.push(...lines.items);
        this.hasNextPage = lines.hasNext;
        this.loadingFirstPage = LoadingState.DEFAULT;
        this.loadingAdditionalPage = LoadingState.DEFAULT;
      });
    }
  }

  openVideo(event: MouseEvent, line: Line){
    event.preventDefault();
    event.stopPropagation();
    if(line.videos.length > 0){
      window.open(line.videos[0].url);
    }
  }

  protected readonly gradeNameByValue = gradeNameByValue;
}
