import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostListener,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { SearchService } from '../../../services/crud/search.service';
import { Searchable } from '../../../models/searchable';
import { RecentSearchHistoryService } from '../../../services/core/recent-search-history.service';

import { debounceTime, Subject } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader2, lucideSearch, lucideX } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInputGroupImports } from '@spartan-ng/helm/input-group';
import { SearchableComponent } from '../searchable/searchable.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';

@Component({
  selector: 'lc-search-dialog',
  imports: [
    FormsModule,
    TranslocoDirective,
    NgIcon,
    HlmButton,
    HlmInputGroupImports,
    SearchableComponent,
  ],
  providers: [provideIcons({ lucideLoader2, lucideSearch, lucideX })],
  templateUrl: './search-dialog.component.html',
  styleUrl: './search-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class SearchDialogComponent {
  public query = '';
  public searchables: Searchable[] = [];
  public recentSearchables: Searchable[] = [];
  public loading = false;
  private queryUpdate = new Subject<any>();

  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private searchService = inject(SearchService);
  private router = inject(Router);
  private ref = inject(BrnDialogRef);
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
            // The dialog shell is OnPush, so this async result is skipped until
            // the closing click. Refresh here so history is visible while open.
            this.cdr.markForCheck();
          });
      });
    this.queryUpdate.pipe(debounceTime(400)).subscribe(() => {
      if (this.query) {
        this.searchService.search(this.query).subscribe((searchables) => {
          this.searchables = searchables;
          this.loading = false;
          this.cdr.markForCheck();
        });
      } else {
        this.searchables = [];
        this.loading = false;
        this.cdr.markForCheck();
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

  /**
   * Close on Escape from this host so the search dialog always dismisses.
   */
  @HostListener('document:keydown.escape', ['$event'])
  onDocumentEscape(event: Event) {
    event.preventDefault();
    this.close();
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
