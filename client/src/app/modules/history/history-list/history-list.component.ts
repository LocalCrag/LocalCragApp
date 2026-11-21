import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { HistoryService } from '../../../services/crud/history.service';
import { HistoryItem } from '../../../models/history-item';
import { HistoryItemType } from '../../../enums/history-item-type';
import { Line } from '../../../models/line';
import { forkJoin, Observable, of } from 'rxjs';
import { LoadingState } from '../../../enums/loading-state';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { ScalesService } from '../../../services/crud/scales.service';
import { map, switchMap } from 'rxjs/operators';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { withAssumedGradeRange } from '../../../utility/grade/assumed-grade-label';
import { ObjectType } from '../../../models/object';
import { ApiQueryParams } from '../../../utility/http/query-params';
import { PageTitleService } from '../../../services/core/page-title.service';
import { TopoHierarchyBreadcrumbsComponent } from '../../shared/components/topo-hierarchy-breadcrumbs/topo-hierarchy-breadcrumbs.component';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmTableImports } from '@spartan-ng/helm/table';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronsDown,
  lucideChevronsUp,
  lucideInfo,
  lucidePlus,
  lucideSettings,
} from '@ng-icons/lucide';
import {
  LineHistoryLocation,
  lineHistoryLocation,
} from '../line-history-location';

import { ListSkeletonComponent } from '../../shared/components/list-skeleton/list-skeleton.component';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  providers: [
    provideIcons({
      lucideChevronsDown,
      lucideChevronsUp,
      lucideInfo,
      lucidePlus,
      lucideSettings,
    }),
  ],
  selector: 'lc-history-list',
  imports: [
    ListSkeletonComponent,
    LoadingButtonComponent,
    ...HlmTableImports,
    TranslocoDirective,
    AsyncPipe,
    RouterLink,
    InfiniteScrollDirective,
    DatePipe,
    TopoHierarchyBreadcrumbsComponent,
    HlmAlert,
    HlmAlertDescription,
    NgIcon,
  ],
  templateUrl: './history-list.component.html',
  styleUrl: './history-list.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryListComponent implements OnInit, PaginatedListView {
  @ViewChild('loadMoreSentinel')
  private loadMoreSentinel?: ElementRef<HTMLElement>;

  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.INITIAL_LOADING;
  public hasNextPage = true;
  public currentPage = 0;
  public historyItems: HistoryItem[] = [];
  public historyItemType = HistoryItemType;

  private historyService = inject(HistoryService);
  private translateSpecialGradesService = inject(TranslateSpecialGradesService);
  private transloco = inject(TranslocoService);
  private scalesService = inject(ScalesService);
  private cdr = inject(ChangeDetectorRef);
  private pageTitleService = inject(PageTitleService);

  loadFirstPage() {
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  loadNextPage() {
    const page = beginPaginatedPageLoad(this, () => {
      this.historyItems = [];
    });
    if (page === null) {
      return;
    }
    const params: ApiQueryParams = {
      page: this.currentPage,
      per_page: 10,
    };
    this.historyService.getHistory(params).subscribe((historyItems) => {
      this.historyItems = [...this.historyItems, ...historyItems.items];
      completePaginatedPageLoad(this, historyItems.hasNext);
      this.cdr.detectChanges();
      // The first page fits on a tall screen, so the button is already
      // visible and the scroll listener never runs. Keep fetching while it is.
      requestAnimationFrame(() => this.autoloadIfButtonVisible());
    });
  }

  /**
   * Fetch the next page when the load-more button is already in view.
   */
  private autoloadIfButtonVisible(): void {
    const element = this.loadMoreSentinel?.nativeElement;
    if (!element) {
      return;
    }
    if (element.getBoundingClientRect().top <= window.innerHeight) {
      this.loadNextPage();
    }
  }

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.transloco.translate(marker('history.historyTitle')),
    );
    this.loadFirstPage();
  }

  lineLocation(event: HistoryItem): LineHistoryLocation | null {
    if (event.objectType !== ObjectType.Line) {
      return null;
    }
    return lineHistoryLocation(event.object as Line);
  }

  objectLink(event: HistoryItem): string | null {
    const object = event.object as { routerLink?: string | null } | null;
    return object?.routerLink ?? null;
  }

  objectName(event: HistoryItem): string {
    const object: object = event.object;
    if ('name' in object && typeof object.name === 'string') {
      return object.name;
    }
    return '';
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

  /**
   * Compact old → new grade for an update row. Creates have no grade move.
   */
  gradeChange(event: HistoryItem): Observable<string> {
    if (
      event.type !== HistoryItemType.UPDATED ||
      event.objectType !== ObjectType.Line
    ) {
      return of('');
    }
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
      switchMap(([oldGrade, newGrade]) =>
        forkJoin([
          withAssumedGradeRange(
            this.scalesService,
            line,
            Number(event.oldValue),
            this.translateSpecialGradesService.translate(oldGrade),
          ),
          withAssumedGradeRange(
            this.scalesService,
            line,
            Number(event.newValue),
            this.translateSpecialGradesService.translate(newGrade),
          ),
        ]),
      ),
      map(([oldGrade, newGrade]) => `${oldGrade} → ${newGrade}`),
    );
  }

  isUpgrade(event: HistoryItem): boolean {
    return this.gradeDirection(event) === 'up';
  }

  isDowngrade(event: HistoryItem): boolean {
    return this.gradeDirection(event) === 'down';
  }

  getIcon(event: HistoryItem): string {
    if (event.type === HistoryItemType.CREATED) {
      return 'lucidePlus';
    }
    if (event.type === HistoryItemType.UPDATED) {
      const direction = this.gradeDirection(event);
      if (direction === 'up') {
        return 'lucideChevronsUp';
      }
      if (direction === 'down') {
        return 'lucideChevronsDown';
      }
      return 'lucideSettings';
    }
    return '';
  }

  /**
   * Grade moves with a real grade (value >= 0). Project-status changes stay neutral.
   */
  private gradeDirection(event: HistoryItem): 'up' | 'down' | null {
    if (event.type !== HistoryItemType.UPDATED || Number(event.newValue) < 0) {
      return null;
    }
    const oldValue = Number(event.oldValue);
    const newValue = Number(event.newValue);
    if (oldValue < newValue) {
      return 'up';
    }
    if (oldValue > newValue) {
      return 'down';
    }
    return null;
  }
}
