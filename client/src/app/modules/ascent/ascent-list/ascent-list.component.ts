import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { AscentsService } from '../../../services/crud/ascents.service';
import { Ascent } from '../../../models/ascent';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { LoadingState } from '../../../enums/loading-state';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { RatingModule } from 'primeng/rating';
import { AvatarModule } from 'primeng/avatar';
import { UpgradePipe } from '../pipes/upgrade.pipe';
import { DowngradePipe } from '../pipes/downgrade.pipe';
import { ConsensusGradePipe } from '../pipes/consensus-grade.pipe';
import { TagModule } from 'primeng/tag';
import { Store } from '@ngrx/store';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AscentFormComponent } from '../ascent-form/ascent-form.component';
import { AscentFormTitleComponent } from '../ascent-form-title/ascent-form-title.component';
import { environment } from '../../../../environments/environment';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { Actions, ofType } from '@ngrx/effects';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { User } from '../../../models/user';
import { SliderLabelsComponent } from '../../shared/components/slider-labels/slider-labels.component';
import { SliderModule } from 'primeng/slider';
import { MenuModule } from 'primeng/menu';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';
import { RegionService } from '../../../services/crud/region.service';
import { Select } from 'primeng/select';
import { RouterLink } from '@angular/router';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { AscentListSkeletonComponent } from '../ascent-list-skeleton/ascent-list-skeleton.component';
import { Message } from 'primeng/message';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'lc-ascent-list',
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    TranslocoDirective,
    ButtonModule,
    DataViewModule,
    HasPermissionDirective,
    NgForOf,
    FormsModule,
    NgClass,
    ConfirmPopupModule,
    RatingModule,
    AsyncPipe,
    AvatarModule,
    UpgradePipe,
    DowngradePipe,
    ConsensusGradePipe,
    TagModule,
    SliderLabelsComponent,
    SliderModule,
    MenuModule,
    Select,
    RouterLink,
    InfiniteScrollDirective,
    AscentListSkeletonComponent,
    Message,
    DatePipe,
    TranslateSpecialGradesPipe,
    LineGradePipe,
  ],
  templateUrl: './ascent-list.component.html',
  styleUrl: './ascent-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [DialogService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@UntilDestroy()
export class AscentListComponent implements OnInit, OnChanges {
  @Input() user: User;
  @Input() cragId: string;
  @Input() sectorId: string;
  @Input() areaId: string;
  @Input() lineId: string;
  @Input() disableGradeOrderAndFiltering = false;
  /**
   * If true, the component will not start loading ascents until the parent component
   * sets the loading state to false. This is necessary as the parent needs to load e.g. the line to
   * pass the id to the ascent list component.
   */
  @Input() parentLoading = false;

  private parentLoading$ = new BehaviorSubject<boolean>(this.parentLoading);
  private regionGradesLoaded$ = new BehaviorSubject<boolean>(false);

  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public ascents: Ascent[];
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;

  public availableScales: SelectItem<
    { lineType: LineType; gradeScale: string } | undefined
  >[] = [];
  public scaleKey: SelectItem<
    { lineType: LineType; gradeScale: string } | undefined
  >;

  public minGradeValue = 0; // Skip project grades
  public maxGradeValue = null;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue];
  public orderOptions: SelectItem[];
  public orderKey: SelectItem;
  public orderDirectionOptions: SelectItem[];
  public orderDirectionKey: SelectItem;
  public ascentActionItems: MenuItem[];
  public clickedAscentForAction: Ascent;

  private loadedGradeFilterRange: number[] = null;

  constructor(
    private ascentsService: AscentsService,
    private dialogService: DialogService,
    private store: Store,
    private actions$: Actions,
    private confirmationService: ConfirmationService,
    private translocoService: TranslocoService,
    protected scalesService: ScalesService,
    private regionService: RegionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['parentLoading']) {
      this.parentLoading$.next(changes['parentLoading'].currentValue);
    }
  }

  ngOnInit() {
    // Only offer lineType/gradeScales for filtering that are indeed available
    this.regionService.getRegionGrades().subscribe((gradeDistribution) => {
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
      this.regionGradesLoaded$.next(true);
    });

    // Call initial selectScale() (which loads th first page) only when both conditions are met:
    // 1. parentLoading is false
    // 2. regionGradesLoaded is true
    combineLatest([this.parentLoading$, this.regionGradesLoaded$])
      .pipe(
        filter(
          ([parentLoading, regionGradesLoaded]) =>
            !parentLoading && regionGradesLoaded,
        ),
        take(1),
      )
      .subscribe(() => {
        this.selectScale();
      });

    this.orderOptions = [
      {
        label: this.translocoService.translate(marker('orderByTimeCreated')),
        value: 'time_created',
      },
      {
        label: this.translocoService.translate(marker('orderByAscentDate')),
        value: 'ascent_date',
      },
    ];
    if (!this.disableGradeOrderAndFiltering) {
      this.orderOptions.push({
        label: this.translocoService.translate(marker('orderByGrade')),
        value: 'grade_value',
      });
    }
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
      .pipe(ofType(reloadAfterAscent), untilDestroyed(this))
      .subscribe(() => {
        this.loadFirstPage();
      });
    this.ascentActionItems = [
      {
        label: this.translocoService.translate('ascent.editAscent'),
        icon: 'pi pi-pencil',
        id: 'edit-ascent', // id is needed for cypress testing
        command: () => {
          this.editAscent(this.clickedAscentForAction);
        },
      },
      {
        label: this.translocoService.translate('ascent.deleteAscent'),
        icon: 'pi pi-trash',
        id: 'delete-ascent', // id is needed for cypress testing
        command: (e) => {
          this.confirmDeleteAscent(
            e.originalEvent,
            this.clickedAscentForAction,
          );
        },
      },
    ];
  }

  selectScale() {
    if (this.scaleKey?.value) {
      this.scalesService
        .getScale(this.scaleKey.value.lineType, this.scaleKey.value.gradeScale)
        .subscribe((scale) => {
          this.maxGradeValue = Math.max(
            ...scale.grades.map((grade) => grade.value),
          );
          this.gradeFilterRange = [0, this.maxGradeValue];
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
        this.ascents = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      const filters = new URLSearchParams();
      filters.set('page', this.currentPage.toString());
      if (this.gradeFilterRange[1] !== null) {
        filters.set('min_grade', this.gradeFilterRange[0].toString());
        filters.set('max_grade', this.gradeFilterRange[1].toString());
      }
      if (this.scaleKey?.value) {
        filters.set('line_type', this.scaleKey.value.lineType);
        filters.set('grade_scale', this.scaleKey.value.gradeScale);
      }
      filters.set('order_by', this.orderKey.value);
      filters.set('order_direction', this.orderDirectionKey.value);
      filters.set('per_page', '10');
      if (this.user) {
        filters.set('user_id', this.user.id);
      }
      if (this.cragId) {
        filters.set('crag_id', this.cragId);
      }
      if (this.sectorId) {
        filters.set('sector_id', this.sectorId);
      }
      if (this.areaId) {
        filters.set('area_id', this.areaId);
      }
      if (this.lineId) {
        filters.set('line_id', this.lineId);
      }
      const filterString = `?${filters.toString()}`;
      this.ascentsService.getAscents(filterString).subscribe((ascents) => {
        this.ascents.push(...ascents.items);
        this.hasNextPage = ascents.hasNext;
        this.loadingFirstPage = LoadingState.DEFAULT;
        this.loadingAdditionalPage = LoadingState.DEFAULT;
        this.cdr.detectChanges();
      });
    }
  }

  editAscent(ascent: Ascent) {
    this.ref = this.dialogService.open(AscentFormComponent, {
      modal: true,
      templates: {
        header: AscentFormTitleComponent,
      },
      focusOnShow: false,
      data: {
        ascent,
      },
    });
  }

  confirmDeleteAscent(event: Event, ascent: Ascent) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(
          marker('ascent.askReallyWantToDeleteAscent'),
        ),
        acceptLabel: this.translocoService.translate(
          marker('ascent.yesDelete'),
        ),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('ascent.noDontDelete'),
        ),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteAscent(ascent);
        },
      });
    });
  }

  public deleteAscent(ascent: Ascent) {
    this.ascentsService.deleteAscent(ascent).subscribe(() => {
      this.store.dispatch(toastNotification('ASCENT_DELETED'));
      this.store.dispatch(
        reloadAfterAscent({ ascendedLineId: ascent.line.id }),
      );
    });
  }

  protected readonly LineType = LineType;
}
