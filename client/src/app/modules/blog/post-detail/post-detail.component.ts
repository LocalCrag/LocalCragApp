import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { TranslocoDirective } from '@jsverse/transloco';
import { Title } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Post } from '../../../models/post';
import { PostsService } from '../../../services/crud/posts.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { CommentsComponent } from '../../comments/comments/comments.component';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { DatePipe } from '../../shared/pipes/date.pipe';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';

/**
 * Single news post with discussion.
 */
@Component({
  selector: 'lc-post-detail',
  imports: [
    TranslocoDirective,
    CardModule,
    ButtonModule,
    DividerModule,
    RouterLink,
    CommentsComponent,
    SanitizeHtmlPipe,
    DatePipe,
    HasPermissionDirective,
  ],
  templateUrl: './post-detail.component.html',
  styleUrl: './post-detail.component.scss',
})
export class PostDetailComponent implements OnInit {
  public post: Post | null = null;

  private route = inject(ActivatedRoute);
  private postsService = inject(PostsService);
  private title = inject(Title);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((p) => p.get('post-slug')),
        filter((slug): slug is string => !!slug),
        takeUntilDestroyed(this.destroyRef),
        switchMap((slug) => this.postsService.getPost(slug)),
      )
      .subscribe((post) => {
        this.post = post;
        this.store
          .pipe(select(selectInstanceName), take(1))
          .subscribe((instanceName) => {
            this.title.setTitle(`${post.title} - ${instanceName}`);
          });
      });
  }
}
