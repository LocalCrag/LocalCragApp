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
import { Button } from 'primeng/button';
import { CommentsSkeletonComponent } from '../comments-skeleton/comments-skeleton.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { Message } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommentComponent } from '../comment/comment.component';
import { CommentsContextService } from '../comments-context.service';
import { ApiQueryParams } from '../../../utility/http/query-params';

@Component({
  selector: 'lc-comments',
  imports: [
    CommentEditorComponent,
    Button,
    CommentsSkeletonComponent,
    HasPermissionDirective,
    InfiniteScrollDirective,
    Message,
    TranslocoDirective,
    CommentComponent,
  ],
  templateUrl: './comments.component.html',
  styleUrl: './comments.component.scss',
  providers: [CommentsContextService],
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
  public loading: LoadingState = LoadingState.DEFAULT;
  public commentsContextService = inject(CommentsContextService);

  private destroyRef = inject(DestroyRef);
  private commentsService = inject(CommentsService);
  private cdr = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['object'] || !this.object?.id) {
      return;
    }
    this.commentsContextService.object = this.object;
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

  onCommentCreated(comment: Comment): void {
    this.comments.unshift(comment);
    this.commentsContextService.addComments([comment]);
    this.emitCount();
  }

  private emitCount(): void {
    this.countChange.emit(
      this.comments.filter((comment) => !comment.isDeleted).length,
    );
  }
}
