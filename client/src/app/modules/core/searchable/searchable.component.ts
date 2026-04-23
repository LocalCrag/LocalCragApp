import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { Searchable } from '../../../models/searchable';
import { AvatarModule } from 'primeng/avatar';
import { UserAvatarComponent } from '../../shared/components/user-avatar/user-avatar.component';
import { AsyncPipe } from '@angular/common';
import { TranslocoDirective } from '@jsverse/transloco';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RecentSearchHistoryService } from '../../../services/core/recent-search-history.service';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { take } from 'rxjs/operators';

@Component({
  selector: 'lc-searchable',
  imports: [
    AvatarModule,
    UserAvatarComponent,
    TranslocoDirective,
    RouterLink,
    LineGradePipe,
    AsyncPipe,
  ],
  templateUrl: './searchable.component.html',
  styleUrl: './searchable.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class SearchableComponent {
  private store = inject(Store);
  private recentSearchHistory = inject(RecentSearchHistoryService);

  protected scalesService = inject(ScalesService);

  @Input() disableNavigation = false;
  /**
   * When true, clicking a navigable result is stored as a recent search selection (search dialog only).
   */
  @Input() recordRecentSearchHistory = false;
  @Input() searchable: Searchable;
  @Output() selected = new EventEmitter<void>();
  /**
   * Set to true if searchable is displayed in a small container. Will apply ellipsis to texts and force a single line.
   */
  @HostBinding('class.ellipsis')
  @Input()
  ellipsis = false;
  protected readonly environment = environment;

  protected rememberSearchSelection(): void {
    if (
      this.recordRecentSearchHistory &&
      !this.disableNavigation &&
      this.searchable
    ) {
      this.store
        .select(selectIsLoggedIn)
        .pipe(take(1))
        .subscribe((isLoggedIn) => {
          if (isLoggedIn) {
            this.recentSearchHistory.recordSelection(this.searchable);
          }
        });
    }
  }

  protected onSearchResultClick(): void {
    this.rememberSearchSelection();
    this.selected.emit();
  }

  public lineGradeValue() {
    if (!this.searchable.line) return of(undefined);
    return this.store
      .select(selectInstanceSettingsState)
      .pipe(
        map((state) =>
          state.displayUserGrades
            ? this.searchable.line.userGradeValue
            : this.searchable.line.authorGradeValue,
        ),
      );
  }
}
