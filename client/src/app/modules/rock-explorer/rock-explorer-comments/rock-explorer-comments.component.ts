import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';
import { Comment } from '../../../models/comment';
import { RockExplorerCluster } from '../../../models/rock-explorer-cluster';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { getObjectType } from '../../../models/object';
import { LoadingState } from '../../../enums/loading-state';
import { CommentsService } from '../../../services/crud/comments.service';
import { ApiQueryParams } from '../../../utility/http/query-params';
import {
  beginPaginatedPageLoad,
  completePaginatedPageLoad,
  failPaginatedPageLoad,
  loadFirstPaginatedPage,
  PaginatedListView,
} from '../../../utility/paginated-list';
import { CommentComponent } from '../../comments/comment/comment.component';
import { CommentEditorComponent } from '../../comments/comment-editor/comment-editor.component';
import { CommentsContextService } from '../../comments/comments-context.service';
import { CommentsSkeletonComponent } from '../../comments/comments-skeleton/comments-skeleton.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

@Component({
  selector: 'lc-rock-explorer-comments',
  imports: [
    CommentComponent,
    CommentEditorComponent,
    CommentsSkeletonComponent,
    HasPermissionDirective,
    Button,
    Message,
    TranslocoDirective,
  ],
  providers: [CommentsContextService],
  templateUrl: './rock-explorer-comments.component.html',
  styleUrl: './rock-explorer-comments.component.scss',
})
export class RockExplorerCommentsComponent
  implements OnChanges, PaginatedListView
{
  @Input({ required: true }) object!: RockExplorerFeature | RockExplorerCluster;

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
    this.loadFirstPage();
  }

  loadFirstPage(): void {
    loadFirstPaginatedPage(this, () => this.loadNextPage());
  }

  loadNextPage(): void {
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
      'object-id': this.object.id,
    };
    this.commentsService
      .getComments(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (pageResult) => {
          this.comments.push(...pageResult.items);
          this.commentsContextService.addComments(pageResult.items);
          completePaginatedPageLoad(this, pageResult.hasNext);
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
  }
}
