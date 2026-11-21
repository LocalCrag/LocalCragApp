import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommentEditorComponent } from '../comment-editor/comment-editor.component';
import { getObjectType, LCObject } from '../../../models/object';
import { Comment } from '../../../models/comment';
import { LoadingState } from '../../../enums/loading-state';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  failPaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { CommentsService } from '../../../services/crud/comments.service';
import { CommentsSkeletonComponent } from '../comments-skeleton/comments-skeleton.component';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommentComponent } from '../comment/comment.component';
import { CommentsContextService } from '../comments-context.service';
import { ApiQueryParams } from '../../../utility/http/query-params';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { selectSoftGating } from '../../../ngrx/selectors/instance-settings.selectors';
import { combineLatest } from 'rxjs';
import { TranslocoService } from '@jsverse/transloco';
import { openAccountPrompt } from '../../core/account-prompt-dialog/account-prompt-dialog.component';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { lucideInfo, lucideMessageSquare } from '@ng-icons/lucide';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'lc-comments',
  imports: [
    LoadingButtonComponent,
    CommentEditorComponent,
    CommentsSkeletonComponent,
    InfiniteScrollDirective,
    TranslocoDirective,
    CommentComponent,
    HlmButton,
    HlmAlert,
    HlmAlertDescription,
    NgIcon,
  ],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    CommentsContextService,
    provideIcons({ lucideInfo, lucideMessageSquare }),
  ],
})
export class CommentsComponent implements OnChanges, PaginatedListView {
  /** Target entity to list/create comments for. */
  @Input({ required: true }) object!: LCObject;
  /** Tighter layout for side panels / tabs. */
  @Input() compact = false;
  @Output() countChange = new EventEmitter<number>();

  public comments: Comment[] = [];
  public hasNextPage = true;
  public currentPage = 0;
  public loadingStates = LoadingState;
  public loading: LoadingState = LoadingState.INITIAL_LOADING;
  public commentsContextService = inject(CommentsContextService);
  public loggedIn = false;
  public softGating = false;

  private destroyRef = inject(DestroyRef);
  private dialogService = inject(HlmDialogService);
  private translocoService = inject(TranslocoService);
  private store = inject(Store);
  private commentsService = inject(CommentsService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    combineLatest([
      this.store.select(selectIsLoggedIn),
      this.store.select(selectSoftGating),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([loggedIn, softGating]) => {
        this.loggedIn = loggedIn;
        this.softGating = softGating;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['object'] || !this.object?.id) {
      return;
    }
    this.commentsContextService.object = this.object;
    this.commentsContextService.notifyCountChanged = () => this.emitCount();
    this.countChange.emit(0);
    this.loadFirstPage();
  }

  loadFirstPage(): void {
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  loadNextPage(): void {
    const objectId = this.object?.id;
    if (!objectId) {
      return;
    }

    const page = beginPaginatedPageLoad(this, () => {
      this.comments = [];
    });
    if (page === null) {
      return;
    }
    const params: ApiQueryParams = {
      page: this.currentPage,
      'per-page': 20,
      'object-type': getObjectType(this.object),
      'object-id': objectId,
    };
    this.commentsService
      .getComments(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageResult) => {
          this.comments.push(...pageResult.items);
          this.commentsContextService.addComments(pageResult.items);
          completePaginatedPageLoad(this, pageResult.hasNext);
          this.emitCount();
          this.cdr.detectChanges();
        },
        error: () => {
          failPaginatedPageLoad(this);
          this.cdr.detectChanges();
        },
      });
  }

  promptForAccount(): void {
    openAccountPrompt(this.dialogService, this.translocoService);
  }

  onCommentCreated(comment: Comment): void {
    this.comments.unshift(comment);
    this.commentsContextService.addComments([comment]);
    this.emitCount();
  }

  private emitCount(): void {
    const total = this.comments.reduce((sum, comment) => {
      const replies = comment.replyCount ?? 0;
      if (comment.isDeleted) {
        return sum + replies;
      }
      return sum + 1 + replies;
    }, 0);
    this.countChange.emit(total);
  }
}
