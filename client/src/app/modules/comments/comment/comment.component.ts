import {
  Component,
  DestroyRef,
  EventEmitter,
  HostBinding,
  inject,
  Input,
  OnInit,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { Comment } from '../../../models/comment';
import { Avatar } from 'primeng/avatar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
import { Button } from 'primeng/button';
import { CommentEditorComponent } from '../comment-editor/comment-editor.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { LoadingState } from '../../../enums/loading-state';
import { map, take } from 'rxjs/operators';
import { CommentsService } from '../../../services/crud/comments.service';
import { ProgressSpinner } from 'primeng/progressspinner';
import { CommentsContextService } from '../comments-context.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, Observable, timer } from 'rxjs';
import { Menu } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import {
  selectCurrentUser,
  selectIsLoggedIn,
  selectIsModerator,
} from '../../../ngrx/selectors/auth.selectors';
import { select, Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'lc-comment',
  imports: [
    Avatar,
    RouterLink,
    TimeAgoPipe,
    Button,
    CommentEditorComponent,
    TranslocoDirective,
    ProgressSpinner,
    Menu,
    AsyncPipe,
  ],
  templateUrl: './comment.component.html',
  styleUrl: './comment.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class CommentComponent implements OnInit {
  @Input() comment: Comment;
  @Input() isRootComment = true;

  @Output() replyCreated = new EventEmitter<Comment>();

  @HostBinding('class.is-highlighted') isHighlighted = false;

  public replyActive = false;
  public hasNextPage = false;
  public loadingReplies = LoadingState.DEFAULT;
  public replies: Comment[] = [];
  public showReplies = false;
  public loadingStates = LoadingState;
  public currentPage = 0;
  public commentsContextService = inject(CommentsContextService);
  public ellipsisMenuItems: MenuItem[] = [];
  public editModeActive = false;
  public isLoggedIn$: Observable<boolean>;

  private pageSize = 10;
  private commentsService = inject(CommentsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private translocoService = inject(TranslocoService);
  private store = inject(Store);

  ngOnInit() {
    // Build ellipsis menu based on permissions
    forkJoin([
      this.store.select(selectCurrentUser).pipe(take(1)),
      this.store.select(selectIsModerator).pipe(take(1)),
    ]).subscribe(([currentUser, isModerator]) => {
      const isAuthor = this.comment.createdBy?.id === currentUser.id;
      if (isAuthor) {
        this.ellipsisMenuItems.push({
          label: this.translocoService.translate(marker('comments.edit')),
          icon: 'pi pi-pencil',
          command: () => {
            this.editModeActive = true;
          },
        });
      }
      if (isModerator || isAuthor) {
        this.ellipsisMenuItems.push({
          label: this.translocoService.translate(marker('comments.delete')),
          icon: 'pi pi-trash',
          command: () => this.deleteComment(),
        });
      }
    });
    // Determine if there are replies to load
    if (this.comment.replyCount > 0) {
      this.hasNextPage = true;
    }
    // When @username is clicked, highlight the comment that was replied to (fragment will change)
    this.route.fragment
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((fragment) => {
        this.isHighlighted = fragment && fragment === this.comment.id;
        if (this.isHighlighted) {
          timer(5000).subscribe(() => {
            this.isHighlighted = false;
          });
        }
      });
    this.isLoggedIn$ = this.store.pipe(select(selectIsLoggedIn), take(1));
  }

  public setReplyActive(): void {
    this.replyActive = true;
  }

  public toggleShowReplies(): void {
    this.showReplies = !this.showReplies;
    if (this.showReplies && this.replies.length === 0) {
      this.loadNextPageOfReplies();
    }
  }

  loadNextPageOfReplies() {
    if (this.loadingReplies !== LoadingState.LOADING && this.hasNextPage) {
      this.currentPage += 1;
      this.loadingReplies = LoadingState.LOADING;
      if (this.currentPage === 1) {
        this.replies = [];
      }
      const filters = new URLSearchParams({
        page: this.currentPage.toString(),
        'root-id': this.comment.id,
        'per-page': this.pageSize.toString(),
      });
      const filterString = `?${filters.toString()}`;
      this.commentsService
        .getComments(filterString)
        .pipe(
          map((comments) => {
            this.replies.push(...comments.items);
            this.commentsContextService.addComments(comments.items);
            this.hasNextPage = comments.hasNext;
            this.loadingReplies = LoadingState.DEFAULT;
          }),
        )
        .subscribe();
    }
  }

  onReplyCreated(reply: Comment) {
    if (this.isRootComment) {
      this.replyActive = false;
      this.comment.replyCount += 1;
      this.showReplies = true;
      this.loadNextPageOfReplies();
      if (!this.hasNextPage) {
        this.replies.push(reply);
        this.commentsContextService.addComments([reply]);
      }
    } else {
      this.replyCreated.emit(reply);
      this.replyActive = false;
    }
  }

  scrollToParent(): void {
    const parentElement = document.getElementById(this.comment.parentId);
    if (parentElement) {
      const top =
        parentElement.getBoundingClientRect().top + window.scrollY - 15;
      window.scrollTo({ top, behavior: 'smooth' });
      this.router.navigate([], {
        fragment: this.comment.parentId,
        replaceUrl: true,
      });
    }
  }

  deleteComment(): void {
    this.commentsService.deleteComment(this.comment.id).subscribe(() => {
      this.comment.isDeleted = true;
      this.store.dispatch(toastNotification('COMMENT_DELETE_SUCCESS'));
    });
  }

  onEditCancelled() {
    console.log(42);
    this.editModeActive = false;
  }
}
