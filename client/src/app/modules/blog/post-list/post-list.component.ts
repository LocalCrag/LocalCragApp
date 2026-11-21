import {
  Component,
  OnInit,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { forkJoin, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Post } from '../../../models/post';
import { PostsService } from '../../../services/crud/posts.service';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import {
  selectInstanceName,
  selectBgImage,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { PostListSkeletonComponent } from '../post-list-skeleton/post-list-skeleton.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { LanguageService } from '../../../services/core/language.service';
import { PageTitleService } from '../../../services/core/page-title.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideFilePen, lucideInfo, lucidePlus } from '@ng-icons/lucide';

/**
 * A component that shows a list of blog posts.
 */
interface SelectItem<T = any> {
  label?: string;
  value?: T;
  [key: string]: any;
}

@Component({
  providers: [provideIcons({ lucideFilePen, lucideInfo, lucidePlus })],
  selector: 'lc-post-list',
  imports: [
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    HasPermissionDirective,
    PostListSkeletonComponent,
    SanitizeHtmlPipe,
    DatePipe,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    ...HlmSelectImports,
    NgIcon,
  ],
  templateUrl: './post-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './post-list.component.scss',
})
export class PostListComponent implements OnInit {
  public posts: Post[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;
  public postsService = inject(PostsService);

  private store = inject(Store);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);
  private pageTitleService = inject(PageTitleService);

  /**
   * Loads the posts on initialization.
   */
  ngOnInit() {
    this.setPageTitle();
    this.languageService.renderedLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rendered) => {
        if (!rendered) return;
        this.setPageTitle();
      });
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('postListBrowserTitle'))} - ${instanceName}`,
      );
    });
  }

  private setPageTitle(): void {
    this.store
      .select(selectBgImage)
      .pipe(take(1))
      .subscribe((bgImage) => {
        this.pageTitleService.setTitle(
          this.translocoService.translate(
            marker('posts.postList.postListTitle'),
          ),
          { image: bgImage ?? null },
        );
      });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([this.postsService.getPosts()]).subscribe(([posts]) => {
      this.posts = posts;
      this.loading = LoadingState.DEFAULT;
      this.buildSortOptions();
      this.languageService.renderedLanguage$
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((rendered) => {
          if (!rendered) return;
          this.buildSortOptions();
        });
    });
  }

  private buildSortOptions() {
    this.sortOptions = [
      {
        label: this.translocoService.translate(marker('sortNewToOld')),
        value: 'timeCreated',
      },
      {
        label: this.translocoService.translate(marker('sortOldToNew')),
        value: '!timeCreated',
      },
    ];
    this.sortKey = this.sortOptions[0];
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    const value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

  sortClientList<T>(items: T[] | null | undefined): T[] {
    if (!items || !this.sortField) {
      return items ?? [];
    }
    const direction = this.sortOrder ?? 1;
    return [...items].sort((a: any, b: any) => {
      const left = a?.[this.sortField];
      const right = b?.[this.sortField];
      if (left === right) {
        return 0;
      }
      if (left == null) {
        return 1;
      }
      if (right == null) {
        return -1;
      }
      return left > right ? direction : -direction;
    });
  }
}
