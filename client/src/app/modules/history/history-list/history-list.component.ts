import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { CardModule } from 'primeng/card';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { TimelineModule } from 'primeng/timeline';
import { ButtonModule } from 'primeng/button';
import { HistoryService } from '../../../services/crud/history.service';
import { HistoryItem } from '../../../models/history-item';
import { HistoryItemType } from '../../../enums/history-item-type';
import { ObjectType } from '../../../models/tag';
import { Line } from '../../../models/line';
import { Area } from '../../../models/area';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { select, Store } from '@ngrx/store';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { forkJoin, Observable, of } from 'rxjs';
import { LoadingState } from '../../../enums/loading-state';
import { MessageModule } from 'primeng/message';
import { ScalesService } from '../../../services/crud/scales.service';
import { map } from 'rxjs/operators';
import { TranslateSpecialGradesPipe } from '../../shared/pipes/translate-special-grades.pipe';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { DatePipe } from '../../shared/pipes/date.pipe';

@Component({
  selector: 'lc-history-list',
  imports: [
    BreadcrumbModule,
    CardModule,
    NgIf,
    TranslocoDirective,
    TimelineModule,
    ButtonModule,
    AsyncPipe,
    NgClass,
    MessageModule,
    RouterLink,
    InfiniteScrollDirective,
    DatePipe,
  ],
  templateUrl: './history-list.component.html',
  styleUrl: './history-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    private translateSpecialGradesPipe: TranslateSpecialGradesPipe,
    private router: Router,
    private store: Store,
    private transloco: TranslocoService,
    private scalesService: ScalesService,
    private cdr: ChangeDetectorRef,
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
      const filters = new URLSearchParams({
        page: this.currentPage.toString(),
        per_page: '10',
      });
      const filterString = `?${filters.toString()}`;
      this.historyService.getHistory(filterString).subscribe((historyItems) => {
        this.historyItems = [...this.historyItems, ...historyItems.items];
        this.hasNextPage = historyItems.hasNext;
        this.loadingFirstPage = LoadingState.DEFAULT;
        this.loadingAdditionalPage = LoadingState.DEFAULT;
        this.cdr.detectChanges();
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
          if (Number(event.newValue) >= 0) {
            /** t(history.grading_changed) */
            return this.transloco.translate('history.grading_changed');
          } else {
            /** t(history.project_status_changed) */
            return this.transloco.translate('history.project_status_changed');
          }
        default:
          return '';
      }
    }
    return '';
  }

  getDescription(event: HistoryItem): Observable<string> {
    if (event.type === HistoryItemType.UPDATED) {
      if (event.objectType === ObjectType.Line) {
        const line = event.object as Line;

        return forkJoin([
          this.scalesService.gradeNameByValue(
            line.type,
            line.gradeScale,
            Number(event.oldValue),
          ),
          this.scalesService.gradeNameByValue(
            line.type,
            line.gradeScale,
            Number(event.newValue),
          ),
        ]).pipe(
          map(([oldGrade, newGrade]) => {
            return [
              this.translateSpecialGradesPipe.transform(oldGrade),
              this.translateSpecialGradesPipe.transform(newGrade),
            ];
          }),
          map(([oldGrade, newGrade]) => {
            if (
              Number(event.oldValue) < 0 &&
              Number(event.oldValue) < Number(event.newValue) &&
              Number(event.newValue) >= 0
            ) {
              /** t(history.projectClimbed) */
              return this.transloco.translate('history.projectClimbed', {
                line: line.name,
                newGrade,
              });
            } else if (
              Number(event.oldValue) < 0 &&
              Number(event.newValue) < 0
            ) {
              /** t(history.projectStatusChanged) */
              return this.transloco.translate('history.projectStatusChanged', {
                line: line.name,
                oldGrade,
                newGrade,
              });
            } else if (
              Number(event.oldValue) === 0 &&
              Number(event.oldValue) < Number(event.newValue)
            ) {
              /** t(history.lineGraded) */
              return this.transloco.translate('history.lineGraded', {
                line: line.name,
                newGrade,
              });
            } else if (Number(event.oldValue) < Number(event.newValue)) {
              /** t(history.upgrade) */
              return this.transloco.translate('history.upgrade', {
                line: line.name,
                oldGrade,
                newGrade,
              });
            } else {
              /** t(history.downgrade) */
              return this.transloco.translate('history.downgrade', {
                line: line.name,
                oldGrade,
                newGrade,
              });
            }
          }),
        );
      }
    }
    return of('');
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
      if (Number(event.newValue) >= 0) {
        if (Number(event.oldValue) < Number(event.newValue)) {
          return 'pi pi-arrow-up';
        } else if (Number(event.oldValue) > Number(event.newValue)) {
          return 'pi pi-arrow-down';
        }
      }
      return 'pi pi-cog';
    }
    return '';
  }
}
