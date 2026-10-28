import { NgTemplateOutlet } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { Button, ButtonDirective, ButtonLabel } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Message } from 'primeng/message';
import { Rating } from 'primeng/rating';
import { Skeleton } from 'primeng/skeleton';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { LoadingState } from '../../../enums/loading-state';
import {
  ControversyKind,
  RatingControversy,
} from '../../../models/rating-controversy';
import { selectAuthState } from '../../../ngrx/selectors/auth.selectors';
import { PageTitleService } from '../../../services/core/page-title.service';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { RatingControversiesService } from '../../../services/crud/rating-controversies.service';
import { ScalesService } from '../../../services/crud/scales.service';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  failPaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { TopoHierarchyBreadcrumbsComponent } from '../../shared/components/topo-hierarchy-breadcrumbs/topo-hierarchy-breadcrumbs.component';

interface ControversyRow extends RatingControversy {
  authorGradeName: string;
  userGradeName: string;
}

@Component({
  selector: 'lc-rating-controversies-page',
  imports: [
    NgTemplateOutlet,
    TranslocoDirective,
    RouterLink,
    FormsModule,
    Button,
    ButtonDirective,
    ButtonLabel,
    InputText,
    Message,
    Rating,
    Skeleton,
    Select,
    SelectButton,
    InfiniteScrollDirective,
    TopoHierarchyBreadcrumbsComponent,
  ],
  templateUrl: './rating-controversies-page.component.html',
  styleUrl: './rating-controversies-page.component.scss',
})
export class RatingControversiesPageComponent
  implements OnInit, PaginatedListView
{
  readonly loadingStates = LoadingState;
  loading: LoadingState = LoadingState.DEFAULT;
  hasNextPage = true;
  currentPage = 0;
  rows: ControversyRow[] = [];
  kind: ControversyKind | null = null;
  kindOptions: { label: string; value: ControversyKind }[] = [];
  readonly skeletonRows = [1, 2, 3, 4, 5, 6];
  readonly minAscentOptions = [1, 2, 3, 5, 10, 20, 50].map((value) => ({
    label: String(value),
    value,
  }));
  minAscents = 5;
  compareGrades = false;
  compareRatings = false;
  loaded = false;
  failed = false;
  canReset = false;
  resetConfirmation = '';
  resetFailed = false;
  dismissingId: string | null = null;
  dismissFailedId: string | null = null;

  private controversiesService = inject(RatingControversiesService);
  private store = inject(Store);
  private scalesService = inject(ScalesService);
  private translateGrades = inject(TranslateSpecialGradesService);
  private pageTitleService = inject(PageTitleService);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.pageTitleService.setTitle(
      this.transloco.translate(marker('ratingControversies.title')),
    );
    this.store
      .select(selectAuthState)
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((auth) => {
        this.canReset = !!(auth.user?.admin || auth.user?.superadmin);
      });
    this.kindOptions = [
      {
        label: this.transloco.translate(marker('ratingControversies.grade')),
        value: 'grade',
      },
      {
        label: this.transloco.translate(marker('ratingControversies.rating')),
        value: 'rating',
      },
    ];
    this.loadFirstPage();
  }

  selectKind(kind: ControversyKind): void {
    if (kind === this.kind || this.loading === LoadingState.LOADING) {
      return;
    }
    this.kind = kind;
    this.loadFirstPage();
  }

  selectMinAscents(minAscents: number): void {
    if (
      minAscents === this.minAscents ||
      this.loading === LoadingState.LOADING
    ) {
      return;
    }
    this.minAscents = minAscents;
    this.loadFirstPage();
  }

  get loadingFirstPage(): boolean {
    return this.loading === LoadingState.LOADING && this.currentPage === 1;
  }

  get unavailable(): boolean {
    return (
      this.loaded && !this.failed && !this.compareGrades && !this.compareRatings
    );
  }

  dismiss(row: ControversyRow): void {
    if (!this.kind || this.dismissingId) {
      return;
    }
    this.dismissingId = row.id;
    this.dismissFailedId = null;
    this.controversiesService
      .dismiss(row.id, this.kind)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.rows = this.rows.filter((item) => item.id !== row.id);
          this.dismissingId = null;
        },
        error: () => {
          this.dismissingId = null;
          this.dismissFailedId = row.id;
        },
      });
  }

  resetDismissals(): void {
    this.resetFailed = false;
    this.controversiesService
      .reset(this.resetConfirmation)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resetConfirmation = '';
          this.loadFirstPage();
        },
        error: () => {
          this.resetFailed = true;
        },
      });
  }

  loadFirstPage(): void {
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  loadNextPage(): void {
    const page = beginPaginatedPageLoad(this, () => {
      this.rows = [];
    });
    if (page === null) {
      return;
    }
    this.failed = false;
    this.controversiesService
      .list(page, 20, this.kind, this.minAscents)
      .pipe(
        switchMap((payload) =>
          this.withGradeNames(payload.items).pipe(
            map((items) => ({ ...payload, items })),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (payload) => {
          this.compareGrades = payload.compareGrades;
          this.compareRatings = payload.compareRatings;
          this.kind = payload.kind;
          this.rows = [...this.rows, ...(payload.items as ControversyRow[])];
          this.loaded = true;
          completePaginatedPageLoad(this, payload.hasNext);
        },
        error: () => {
          failPaginatedPageLoad(this);
          this.failed = true;
          this.loaded = true;
        },
      });
  }

  private withGradeNames(items: RatingControversy[]) {
    if (!items.length) {
      return of(items);
    }
    const scales = new Map<
      string,
      { type: RatingControversy['type']; name: string }
    >();
    for (const item of items) {
      scales.set(`${item.type}:${item.gradeScale}`, {
        type: item.type,
        name: item.gradeScale,
      });
    }
    return forkJoin(
      [...scales.entries()].map(([key, scale]) =>
        this.scalesService
          .gradeNameByValueMap(scale.type, scale.name)
          .pipe(map((names) => ({ key, names }))),
      ),
    ).pipe(
      map((results) => {
        const namesByScale = new Map(
          results.map((result) => [result.key, result.names]),
        );
        return items.map((item) => {
          const names =
            namesByScale.get(`${item.type}:${item.gradeScale}`) ?? {};
          return {
            ...item,
            authorGradeName: this.gradeLabel(names, item.authorGradeValue),
            userGradeName: this.gradeLabel(names, item.userGradeValue),
          };
        });
      }),
    );
  }

  private gradeLabel(names: Record<number, string>, value: number): string {
    const name = names[value];
    if (!name) {
      return String(value);
    }
    return this.translateGrades.translate(name);
  }
}
