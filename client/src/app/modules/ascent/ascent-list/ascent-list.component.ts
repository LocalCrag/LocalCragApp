import {Component, Input, OnInit, ViewEncapsulation} from '@angular/core';
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
    InfiniteScrollModule
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

  @Input() userId: string;
  @Input() cragId: string;
  @Input() sectorId: string;
  @Input() areaId: string;
  @Input() lineId: string;

  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public ascents: Ascent[];
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public ref: DynamicDialogRef | undefined;
  public hasNextPage = true;
  public currentPage = 0;


  constructor(private ascentsService: AscentsService,
              private dialogService: DialogService,
              private store: Store,
              private actions$: Actions,
              private confirmationService: ConfirmationService,
              private translocoService: TranslocoService) {

  }

  ngOnInit() {
    this.sortOptions = [
      {
        icon: PrimeIcons.SORT_AMOUNT_DOWN,
        label: this.translocoService.translate(marker('sortDescendingByDate')),
        value: ['order_by=time_created', 'order_direction=desc']
      },
      {
        icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT,
        label: this.translocoService.translate(marker('sortAscendingByDate')),
        value: ['order_by=time_created', 'order_direction=asc']
      },
      {
        icon: PrimeIcons.SORT_AMOUNT_DOWN,
        label: this.translocoService.translate(marker('sortDescendingByAscentDate')),
        value: ['order_by=ascent_date', 'order_direction=desc']
      },
      {
        icon: PrimeIcons.SORT_AMOUNT_DOWN_ALT,
        label: this.translocoService.translate(marker('sortAscendingByAscentDate')),
        value: ['order_by=ascent_date', 'order_direction=asc']
      },
    ];
    this.sortKey = this.sortOptions[0];
    this.loadNextPage();
    this.actions$.pipe(ofType(reloadAfterAscent), untilDestroyed(this)).subscribe(()=>{
      this.currentPage = 1;
      this.loadNextPage();
    })
  }

  loadNextPage(){
    if(this.loadingFirstPage !== LoadingState.LOADING &&this.loadingAdditionalPage !== LoadingState.LOADING && this.hasNextPage) {
      this.currentPage += 1;
      if(this.currentPage === 1){
        this.loadingFirstPage = LoadingState.LOADING
        this.ascents = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      let filters = [`page=${this.currentPage}`]
      filters.push(...this.sortKey.value);
      if (this.userId) {
        filters.push(`user_id=${this.userId}`);
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
      this.store.dispatch(reloadAfterAscent());
    });
  }

}
