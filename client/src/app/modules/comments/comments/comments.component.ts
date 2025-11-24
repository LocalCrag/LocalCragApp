import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { CommentEditorComponent } from '../comment-editor/comment-editor.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { ObjectUtilsService } from '../../../services/utils/object-utils.service';
import { ObjectType } from '../../../models/object';
import { Comment } from '../../../models/comment';
import { LoadingState } from '../../../enums/loading-state';
import { CommentsService } from '../../../services/crud/comments.service';
import { Button } from 'primeng/button';
import { GalleryImageSkeletonComponent } from '../../gallery/gallery-image-skeleton/gallery-image-skeleton.component';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { Message } from 'primeng/message';
import { TranslocoDirective } from '@jsverse/transloco';
import { CommentComponent } from '../comment/comment.component';
import { CommentsContextService } from '../comments-context.service';

@Component({
  selector: 'lc-comments',
  imports: [
    CommentEditorComponent,
    Button,
    GalleryImageSkeletonComponent,
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
export class CommentsComponent implements OnInit {
  public comments: Comment[] = [];
  public hasNextPage = true;
  public currentPage = 0;
  public loadingStates = LoadingState;
  public loadingFirstPage: LoadingState = LoadingState.DEFAULT;
  public loadingAdditionalPage: LoadingState = LoadingState.DEFAULT;
  public commentsContextService = inject(CommentsContextService);

  private objectType: ObjectType;
  private objectSlug: string;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private objectUtilsService = inject(ObjectUtilsService);
  private commentsService = inject(CommentsService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((data) => {
          this.objectType = data['objectType'];
          return this.route.parent!.parent!.paramMap.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap((params) => {
              switch (this.objectType) {
                case ObjectType.Crag:
                  this.objectSlug = params.get('crag-slug');
                  break;
                case ObjectType.Sector:
                  this.objectSlug = params.get('sector-slug');
                  break;
                case ObjectType.Area:
                  this.objectSlug = params.get('area-slug');
                  break;
                case ObjectType.Line:
                  this.objectSlug = params.get('line-slug');
                  break;
                case ObjectType.Region:
                  // Region has no slug in the route - use empty string (getObject ignores slug for Region)
                  this.objectSlug = '';
                  break;
                case ObjectType.User:
                  this.objectSlug = params.get('user-slug');
              }
              return this.objectUtilsService.getObject(
                this.objectType,
                this.objectSlug,
              );
            }),
          );
        }),
      )
      .subscribe((obj) => {
        this.commentsContextService.object = obj;
        this.loadFirstPage();
      });
  }

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
        this.comments = [];
      } else {
        this.loadingAdditionalPage = LoadingState.LOADING;
      }
      const filters = new URLSearchParams({
        page: this.currentPage.toString(),
        'per-page': '20',
      });
      if (this.objectType) {
        filters.set('object-type', this.objectType);
        filters.set('object-id', this.commentsContextService.object.id);
      }
      const filterString = `?${filters.toString()}`;
      this.commentsService
        .getComments(filterString)
        .pipe(
          map((comments) => {
            this.comments.push(...comments.items);
            this.commentsContextService.addComments(comments.items);
            this.hasNextPage = comments.hasNext;
            this.loadingFirstPage = LoadingState.DEFAULT;
            this.loadingAdditionalPage = LoadingState.DEFAULT;
            this.cdr.detectChanges();
          }),
        )
        .subscribe();
    }
  }

  onCommentCreated(comment: Comment) {
    this.comments.unshift(comment);
    this.commentsContextService.addComments([comment]);
  }
}
