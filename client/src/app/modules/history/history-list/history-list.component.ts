import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { SecretSpotTagComponent } from '../../shared/components/secret-spot-tag/secret-spot-tag.component';
import { TabMenuModule } from 'primeng/tabmenu';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { HistoryService } from '../../../services/crud/history.service';
import { HistoryItem } from '../../../models/history-item';
import { SharedModule } from '../../shared/shared.module';
import { HistoryItemType } from '../../../enums/history-item-type';
import { ObjectType } from '../../../models/tag';
import { gradeNameByValue } from '../../../utility/misc/grades';
import { Line } from '../../../models/line';
import { Area } from '../../../models/area';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { select, Store } from '@ngrx/store';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { Observable } from 'rxjs';
import { LoadingState } from '../../../enums/loading-state';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'lc-history-list',
  standalone: true,
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    RouterOutlet,
    SecretSpotTagComponent,
    TabMenuModule,
    TranslocoDirective,
    TimelineModule,
    ButtonModule,
    SharedModule,
    AsyncPipe,
    NgClass,
    InfiniteScrollModule,
    MessageModule,
  ],
  templateUrl: './history-list.component.html',
  styleUrl: './history-list.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class HistoryListComponent implements OnInit {
  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public hasNextPage = true;
  public currentPage = 0;
  public historyItems: HistoryItem[] = [];
  public historyItemType = HistoryItemType;
  public isMobile$: Observable<boolean>;

  constructor(
    private historyService: HistoryService,
    private router: Router,
    private store: Store,
    private transloco: TranslocoService,
  ) {}

  loadFirstPage() {
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
        this.historyItems = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      const filters = [`page=${this.currentPage}`];
      filters.push(`per_page=10`);
      const filterString = `?${filters.join('&')}`;
      this.historyService.getHistory(filterString).subscribe((historyItems) => {
        this.historyItems = [...this.historyItems, ...historyItems.items];
        this.hasNextPage = historyItems.hasNext;
        this.loadingFirstPage = LoadingState.DEFAULT;
        this.loadingAdditionalPage = LoadingState.DEFAULT;
      });
    }
  }

  ngOnInit() {
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.loadFirstPage();
  }

  getHeader(event: HistoryItem): string {
    if (event.type === HistoryItemType.CREATED) {
      switch (event.objectType) {
        case ObjectType.Crag:
          /** t(history.created_crag) */
          return this.transloco.translate('history.created_crag');
        case ObjectType.Sector:
          /** t(history.created_sector) */
          return this.transloco.translate('history.created_sector');
        case ObjectType.Area:
          /** t(history.created_area) */
          return this.transloco.translate('history.created_area');
        case ObjectType.Line:
          /** t(history.created_line) */
          return this.transloco.translate('history.created_line');
        default:
          return '';
      }
    }
    if (event.type === HistoryItemType.UPDATED) {
      switch (event.objectType) {
        case ObjectType.Line:
          /** t(history.grading_changed) */
          return this.transloco.translate('history.grading_changed');
        default:
          return '';
      }
    }
    return '';
  }

  getDescription(event: HistoryItem): string {
    if (event.type === HistoryItemType.UPDATED) {
      if (event.objectType === ObjectType.Line) {
        const oldGrade = this.transloco.translate(
          gradeNameByValue['FB'][Number(event.oldValue)],
        );
        const newGrade = this.transloco.translate(
          gradeNameByValue['FB'][Number(event.newValue)],
        );
        // TODO @BlobbyBob added some more cases here which may need the grade service
        if (
          Number(event.oldValue) < 0 &&
          Number(event.oldValue) < Number(event.newValue)
        ) {
          /** t(history.projectClimbed) */
          return this.transloco.translate('history.projectClimbed', {
            line: event.object.name,
            newGrade,
          });
        } else if (
          Number(event.oldValue) === 0 &&
          Number(event.oldValue) < Number(event.newValue)
        ) {
          /** t(history.lineGraded) */
          return this.transloco.translate('history.lineGraded', {
            line: event.object.name,
            newGrade,
          });
        } else if (Number(event.oldValue) < Number(event.newValue)) {
          /** t(history.upgrade) */
          return this.transloco.translate('history.upgrade', {
            line: event.object.name,
            oldGrade,
            newGrade,
          });
        } else {
          /** t(history.downgrade) */
          return this.transloco.translate('history.downgrade', {
            line: event.object.name,
            oldGrade,
            newGrade,
          });
        }
      }
    }
    return '';
  }

  openObject(event: HistoryItem): void {
    if (event.objectType === ObjectType.Line) {
      const line = event.object as Line;
      this.router.navigate([line.routerLink]);
    }
    if (event.objectType === ObjectType.Area) {
      const area = event.object as Area;
      this.router.navigate([area.routerLink]);
    }
    if (event.objectType === ObjectType.Crag) {
      const crag = event.object as Crag;
      this.router.navigate([crag.routerLink]);
    }
    if (event.objectType === ObjectType.Sector) {
      const sector = event.object as Sector;
      this.router.navigate([sector.routerLink]);
    }
  }

  getIcon(event: HistoryItem): string {
    if (event.type === HistoryItemType.CREATED) {
      return 'pi pi-plus';
    }
    if (event.type === HistoryItemType.UPDATED) {
      if (Number(event.oldValue) < Number(event.newValue)) {
        return 'pi pi-arrow-up';
      } else if (Number(event.oldValue) > Number(event.newValue)) {
        return 'pi pi-arrow-down';
      }
      return 'pi pi-cog';
    }
    return '';
  }
}
