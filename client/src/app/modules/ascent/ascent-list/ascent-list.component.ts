import {Component, HostListener, Input, OnInit, ViewEncapsulation} from '@angular/core';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {CardModule} from 'primeng/card';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {TabMenuModule} from 'primeng/tabmenu';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@ngneat/transloco';
import {AscentsService} from '../../../services/crud/ascents.service';
import {Ascent} from '../../../models/ascent';
import {ButtonModule} from 'primeng/button';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {HasPermissionDirective} from '../../shared/directives/has-permission.directive';
import {SharedModule} from '../../shared/shared.module';
import {LoadingState} from '../../../enums/loading-state';
import {FormsModule} from '@angular/forms';
import {ConfirmationService, PrimeIcons, SelectItem} from 'primeng/api';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {LineModule} from '../../line/line.module';
import {RatingModule} from 'primeng/rating';
import {AvatarModule} from 'primeng/avatar';
import {UpgradePipe} from '../pipes/upgrade.pipe';
import {DowngradePipe} from '../pipes/downgrade.pipe';
import {ConsensusGradePipe} from '../pipes/consensus-grade.pipe';
import {TagModule} from 'primeng/tag';
import {Store} from '@ngrx/store';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';
import {AscentFormComponent} from '../ascent-form/ascent-form.component';
import {AscentFormTitleComponent} from '../ascent-form-title/ascent-form-title.component';
import {environment} from '../../../../environments/environment';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {reloadAfterAscent} from '../../../ngrx/actions/ascent.actions';
import {Actions, ofType} from '@ngrx/effects';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {filter} from 'rxjs/operators';
import {User} from '../../../models/user';
import {gradeNameByValue, GRADES} from '../../../utility/misc/grades';
import {SliderLabelsComponent} from '../../shared/components/slider-labels/slider-labels.component';
import {SliderModule} from 'primeng/slider';

@Component({
  selector: 'lc-ascent-list',
  standalone: true,
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    RouterOutlet,
    TabMenuModule,
    TranslocoDirective,
    ButtonModule,
    DataViewModule,
    DropdownModule,
    HasPermissionDirective,
    NgForOf,
    SharedModule,
    FormsModule,
    NgClass,
    ConfirmPopupModule,
    LineModule,
    RatingModule,
    TranslocoPipe,
    AsyncPipe,
    AvatarModule,
    UpgradePipe,
    DowngradePipe,
    ConsensusGradePipe,
    TagModule,
    InfiniteScrollModule,
    SliderLabelsComponent,
    SliderModule
  ],
  templateUrl: './ascent-list.component.html',
  styleUrl: './ascent-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [
    DialogService,
    ConfirmationService
  ],
})
@UntilDestroy()
export class AscentListComponent implements OnInit {

  @Input() user: User;
  @Input() cragId: string;
  @Input() sectorId: string;
  @Input() areaId: string;
  @Input() lineId: string;
  @Input() disableGradeOrderAndFiltering = false;

  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public ascents: Ascent[];
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;

  public minGradeValue = GRADES['FB'][0].value;
  public maxGradeValue = GRADES['FB'].at(-1).value;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue]
  public orderOptions: SelectItem[];
  public orderKey: SelectItem;
  public orderDirectionOptions: SelectItem[];
  public orderDirectionKey: SelectItem;
  public listenForSliderStop = false;


  constructor(private ascentsService: AscentsService,
              private dialogService: DialogService,
              private store: Store,
              private actions$: Actions,
              private confirmationService: ConfirmationService,
              private translocoService: TranslocoService) {

  }

  ngOnInit() {
    this.orderOptions = [
      {label: this.translocoService.translate(marker('orderByTimeCreated')), value: 'time_created'},
      {label: this.translocoService.translate(marker('orderByAscentDate')), value: 'ascent_date'},
    ];
    if (!this.disableGradeOrderAndFiltering) {
      this.orderOptions.push({label: this.translocoService.translate(marker('orderByGrade')), value: 'grade_value'})
    }
    this.orderKey = this.orderOptions[0];
    this.orderDirectionOptions = [
      {label: this.translocoService.translate(marker('orderDescending')), value: 'desc'},
      {label: this.translocoService.translate(marker('orderAscending')), value: 'asc'},
    ];
    this.orderDirectionKey = this.orderDirectionOptions[0];
    this.loadFirstPage();
    this.actions$.pipe(ofType(reloadAfterAscent), untilDestroyed(this)).subscribe(() => {
      this.loadFirstPage();
    })
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
    if (this.loadingFirstPage !== LoadingState.LOADING && this.loadingAdditionalPage !== LoadingState.LOADING && this.hasNextPage) {
      this.currentPage += 1;
      if (this.currentPage === 1) {
        this.loadingFirstPage = LoadingState.LOADING
        this.ascents = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      let filters = [`page=${this.currentPage}`]
      filters.push(`min_grade=${this.gradeFilterRange[0]}`);
      filters.push(`max_grade=${this.gradeFilterRange[1]}`);
      filters.push(`order_by=${this.orderKey.value}`);
      filters.push(`order_direction=${this.orderDirectionKey.value}`);
      filters.push(`per_page=10`);
      if (this.user) {
        filters.push(`user_id=${this.user.id}`);
      }
      if (this.cragId) {
        filters.push(`crag_id=${this.cragId}`);
      }
      if (this.sectorId) {
        filters.push(`sector_id=${this.sectorId}`);
      }
      if (this.areaId) {
        filters.push(`area_id=${this.areaId}`);
      }
      if (this.lineId) {
        filters.push(`line_id=${this.lineId}`);
      }
      const filterString = `?${filters.join('&')}`;
      this.ascentsService.getAscents(filterString).subscribe(ascents => {
        this.ascents.push(...ascents.items);
        this.hasNextPage = ascents.hasNext;
        this.loadingFirstPage = LoadingState.DEFAULT;
        this.loadingAdditionalPage = LoadingState.DEFAULT;
      });
    }
  }


  editAscent(ascent: Ascent) {
    this.ref = this.dialogService.open(AscentFormComponent, {
      templates: {
        header: AscentFormTitleComponent,
      },
      focusOnShow: false,
      data: {
        ascent
      },
    });
  }

  confirmDeleteAscent(event: Event, ascent: Ascent) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('ascent.askReallyWantToDeleteAscent')),
        acceptLabel: this.translocoService.translate(marker('ascent.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('ascent.noDontDelete')),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteAscent(ascent);
        },
      });
    });
  }

  public deleteAscent(ascent: Ascent) {
    this.ascentsService.deleteAscent(ascent).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.ASCENT_DELETED));
      this.store.dispatch(reloadAfterAscent({ascendedLineId: ascent.line.id}));
    });
  }

  protected readonly gradeNameByValue = gradeNameByValue;
}
