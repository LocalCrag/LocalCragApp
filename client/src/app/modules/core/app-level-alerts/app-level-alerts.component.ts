import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';
import { selectRefreshTokenExpires } from '../../../ngrx/selectors/auth.selectors';
import { unixToDate } from '../../../utility/operators/unix-to-date';
import { filter, map, mergeMap } from 'rxjs/operators';
import { bigIntTimer } from '../../../utility/observables/bigint-timer';
import { openRefreshLoginModal } from 'src/app/ngrx/actions/auth.actions';

import {
  selectShowCookieAlert,
  selectShowRefreshTokenAboutToExpireAlert,
} from '../../../ngrx/selectors/app-level-alerts.selectors';
import { cookiesAccepted } from '../../../ngrx/actions/app-level-alerts.actions';
import { differenceInMilliseconds, subMinutes } from 'date-fns';
import { TranslocoDirective } from '@jsverse/transloco';
import { AsyncPipe, NgClass, NgIf } from '@angular/common';
import { MinutesRemainingPipe } from '../../shared/pipes/minutes-remaining.pipe';
import { Button } from 'primeng/button';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-app-level-alerts',
  templateUrl: './app-level-alerts.component.html',
  styleUrls: ['./app-level-alerts.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    TranslocoDirective,
    NgIf,
    AsyncPipe,
    NgClass,
    MinutesRemainingPipe,
    Button,
  ],
})
export class AppLevelAlertsComponent implements OnInit {
  public showCookieAlert$: Observable<boolean>;
  public refreshLoginAlertType = 'warning';
  public refreshTokenExpires$: Observable<Date>;
  public showRefreshTokenAboutToExpireAlert$: Observable<boolean>;

  private destroyRef = inject(DestroyRef);
  private store = inject<Store<AppState>>(Store);

  /**
   * Sets up subscriptions to change the appearance of the alert.
   */
  ngOnInit(): void {
    this.showCookieAlert$ = this.store.pipe(select(selectShowCookieAlert));
    this.showRefreshTokenAboutToExpireAlert$ = this.store.pipe(
      select(selectShowRefreshTokenAboutToExpireAlert),
    );
    this.refreshTokenExpires$ = this.store.pipe(
      select(selectRefreshTokenExpires),
      unixToDate,
    );
    this.refreshTokenExpires$
      .pipe(
        filter(
          (refreshTokenExpiresDate) => refreshTokenExpiresDate instanceof Date,
        ), // null when logged out
        map((refreshTokenExpiresDate) => {
          const oneMinuteBeforeExpiry = subMinutes(refreshTokenExpiresDate, 1);
          return differenceInMilliseconds(oneMinuteBeforeExpiry, new Date());
        }),
        mergeMap((timeDelta) => bigIntTimer(timeDelta)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.refreshLoginAlertType = 'danger';
      });
  }

  /**
   * Dispatches an action to open the refresh login modal.
   */
  public openRefreshLoginModal() {
    this.store.dispatch(openRefreshLoginModal());
  }

  /**
   * Notifies the app that cookies were accepted.
   */
  public allowCookies() {
    this.store.dispatch(cookiesAccepted());
  }
}
