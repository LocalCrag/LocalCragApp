import {
  Component,
  DestroyRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { SearchService } from '../../../services/crud/search.service';
import { Searchable } from '../../../models/searchable';
import { RecentSearchHistoryService } from '../../../services/core/recent-search-history.service';

import { debounceTime, Subject } from 'rxjs';
import { AvatarModule } from 'primeng/avatar';
import { NavigationEnd, Router } from '@angular/router';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SearchableComponent } from '../searchable/searchable.component';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';

@Component({
  selector: 'lc-search-dialog',
  imports: [
    InputTextModule,
    FormsModule,
    TranslocoDirective,
    AvatarModule,
    ButtonModule,
    MessageModule,
    SearchableComponent,
    InputGroup,
    InputGroupAddon,
  ],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SearchDialogComponent {
  public query = '';
  public searchables: Searchable[] = [];
  public recentSearchables: Searchable[] = [];
  public loading = false;
  private queryUpdate = new Subject<any>();

  private destroyRef = inject(DestroyRef);
  private searchService = inject(SearchService);
  private router = inject(Router);
  private ref = inject(DynamicDialogRef);
  private recentSearchHistory = inject(RecentSearchHistoryService);
  private store = inject(Store);

  constructor() {
    this.store
      .select(selectIsLoggedIn)
      .pipe(take(1))
      .subscribe((isLoggedIn) => {
        if (!isLoggedIn) return;
        this.recentSearchHistory
          .getRecent()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((recentSearchables) => {
            this.recentSearchables = recentSearchables;
          });
      });
    this.queryUpdate.pipe(debounceTime(400)).subscribe(() => {
      if (this.query) {
        this.searchService.search(this.query).subscribe((searchables) => {
          this.searchables = searchables;
          this.loading = false;
        });
      } else {
        this.searchables = [];
        this.loading = false;
      }
    });
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.ref.close();
        }
      });
  }

  search() {
    this.loading = true;
    this.queryUpdate.next(null);
  }

  close() {
    this.ref.close();
  }

  showRecentSearches(): boolean {
    return !this.query?.trim() && this.recentSearchables.length > 0;
  }

  showLiveSearchResults(): boolean {
    return !!this.query?.trim();
  }
}
