import { Component, HostListener, Input, OnInit, ViewEncapsulation, } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { AsyncPipe, NgClass, NgForOf, NgIf } from '@angular/common';
import { TabMenuModule } from 'primeng/tabmenu';
import { TranslocoDirective, TranslocoPipe, TranslocoService, } from '@jsverse/transloco';
import { AscentsService } from '../../../services/crud/ascents.service';
import { Ascent } from '../../../models/ascent';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { DropdownModule } from 'primeng/dropdown';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { SharedModule } from '../../shared/shared.module';
import { LoadingState } from '../../../enums/loading-state';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MenuItem, SelectItem } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { LineModule } from '../../line/line.module';
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
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { reloadAfterAscent } from '../../../ngrx/actions/ascent.actions';
import { Actions, ofType } from '@ngrx/effects';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { User } from '../../../models/user';
import { SliderLabelsComponent } from '../../shared/components/slider-labels/slider-labels.component';
import { SliderModule } from 'primeng/slider';
import { MenuModule } from 'primeng/menu';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';
import { RegionService } from '../../../services/crud/region.service';

@Component({
  selector: 'lc-ascent-list',
  standalone: true,
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
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
    SliderModule,
    MenuModule,
  ],
  templateUrl: './ascent-list.component.html',
  styleUrl: './ascent-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  providers: [DialogService, ConfirmationService],
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

  public availableScales: SelectItem<{lineType: LineType, gradeScale: string} | undefined>[] = [];
  public scaleKey: SelectItem<{lineType: LineType, gradeScale: string} | undefined>;


  public minGradeValue = 0; // Skip project grades
  public maxGradeValue = null;
  public gradeFilterRange = [this.minGradeValue, this.maxGradeValue];
  public orderOptions: SelectItem[];
  public orderKey: SelectItem;
  public orderDirectionOptions: SelectItem[];
  public orderDirectionKey: SelectItem;
  public listenForSliderStop = false;
  public ascentActionItems: MenuItem[];
  public clickedAscentForAction: Ascent;

  constructor(
    private ascentsService: AscentsService,
    private dialogService: DialogService,
    private store: Store,
    private actions$: Actions,
    private confirmationService: ConfirmationService,
    private translocoService: TranslocoService,
    protected scalesService: ScalesService,
    private regionService: RegionService,
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
    this.loadFirstPage();
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

  @HostListener('document:touchend')
  @HostListener('document:mouseup')
  reloadAfterSliderStop() {
    if (this.listenForSliderStop) {
      this.loadFirstPage();
    }
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
        this.ascents = [];
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
      if (this.user) {
        filters.set("user_id", this.user.id);
      }
      if (this.cragId) {
        filters.set("crag_id", this.cragId);
      }
      if (this.sectorId) {
        filters.set("sector_id", this.sectorId);
      }
      if (this.areaId) {
        filters.set("area_id", this.areaId);
      }
      if (this.lineId) {
        filters.set("line_id", this.lineId);
      }
      const filterString = `?${filters.toString()}`;
      this.ascentsService.getAscents(filterString).subscribe((ascents) => {
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
      this.store.dispatch(
        toastNotification(NotificationIdentifier.ASCENT_DELETED),
      );
      this.store.dispatch(
        reloadAfterAscent({ ascendedLineId: ascent.line.id }),
      );
    });
  }

  protected readonly LineType = LineType;
}
