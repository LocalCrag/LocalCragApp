import {Component, OnInit} from '@angular/core';
import {LoadingState} from '../../../enums/loading-state';
import {SelectItem} from 'primeng/api';
import {forkJoin, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {selectIsMobile} from '../../../ngrx/selectors/device.selectors';
import {environment} from '../../../../environments/environment';
import {marker} from '@jsverse/transloco-keys-manager/marker';
import {Post} from '../../../models/post';
import {PostsService} from '../../../services/crud/posts.service';
import {AsyncPipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {RouterLink} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {SharedModule} from '../../shared/shared.module';
import {Title} from '@angular/platform-browser';
import {selectInstanceName} from '../../../ngrx/selectors/instance-settings.selectors';
import {HasPermissionDirective} from '../../shared/directives/has-permission.directive';

/**
 * A component that shows a list of blog posts.
 */
@Component({
  selector: 'lc-post-list',
  standalone: true,
  imports: [
    AsyncPipe,
    ButtonModule,
    CardModule,
    DataViewModule,
    DropdownModule,
    NgForOf,
    NgIf,
    RouterLink,
    TranslocoDirective,
    FormsModule,
    NgClass,
    SharedModule,
    HasPermissionDirective
  ],
  templateUrl: './post-list.component.html',
  styleUrl: './post-list.component.scss'
})
export class PostListComponent implements OnInit{

  public posts: Post[];
  public loading = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public sortOptions: SelectItem[];
  public sortKey: SelectItem;
  public sortOrder: number;
  public sortField: string;
  public isMobile$: Observable<boolean>;

  constructor(public postsService: PostsService,
              private store: Store,
              private title: Title,
              private translocoService: TranslocoService) {
  }

  /**
   * Loads the posts on initialization.
   */
  ngOnInit() {
    this.refreshData();
    this.isMobile$ = this.store.pipe(select(selectIsMobile));
    this.store.select(selectInstanceName).subscribe(instanceName => {
      this.title.setTitle(`${this.translocoService.translate(marker('postListBrowserTitle'))} - ${instanceName}`);
    });
  }

  /**
   * Loads new data.
   */
  refreshData() {
    forkJoin([
      this.postsService.getPosts(),
      this.translocoService.load(`${environment.language}`)
    ]).subscribe(([posts, e]) => {
      this.posts = posts;
      this.loading = LoadingState.DEFAULT;
      this.sortOptions = [
        {label: this.translocoService.translate(marker('sortNewToOld')), value: 'timeCreated'},
        {label: this.translocoService.translate(marker('sortOldToNew')), value: '!timeCreated'},
      ];
      this.sortKey = this.sortOptions[0];
    });
  }

  /**
   * Sets the sort field and order.
   * @param event Sort change event.
   */
  onSortChange(event: any) {
    let value = event.value.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = 1;
      this.sortField = value.substring(1, value.length);
    } else {
      this.sortOrder = -1;
      this.sortField = value;
    }
  }

}
