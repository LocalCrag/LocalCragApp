import { Component, OnInit } from '@angular/core';
import { LoadingState } from '../../../enums/loading-state';
import { SelectItem } from 'primeng/api';
import { forkJoin, Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { selectIsMobile } from '../../../ngrx/selectors/device.selectors';
import { environment } from '../../../../environments/environment';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Post } from '../../../models/post';
import { PostsService } from '../../../services/crud/posts.service';
import { NgClass, NgForOf } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { Title } from '@angular/platform-browser';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { HasPermissionDirective } from '../../shared/directives/has-permission.directive';
import { Select } from 'primeng/select';
import { DataView } from 'primeng/dataview';

/**
 * A component that shows a list of blog posts.
 */
@Component({
  selector: 'lc-post-list',
  imports: [
    DataView,
    ButtonModule,
    CardModule,
    NgForOf,
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    SharedModule,
    HasPermissionDirective,
    Select,
  ],
  templateUrl: './post-list.component.html',
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

  constructor(
    public postsService: PostsService,
    private store: Store,
    private title: Title,
    private translocoService: TranslocoService,
  ) {}

  /**
   * Loads the posts on initialization.
   */
  ngOnInit() {
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe((instanceName) => {
      this.title.setTitle(
        `${this.translocoService.translate(marker('postListBrowserTitle'))} - ${instanceName}`,
      );
    });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([
      this.postsService.getPosts(),
      this.translocoService.load(`${environment.language}`),
    ]).subscribe(([posts]) => {
      this.posts = posts;
      this.loading = LoadingState.DEFAULT;
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
    });
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
}
