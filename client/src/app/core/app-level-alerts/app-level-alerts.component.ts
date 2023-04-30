import {Component, ViewEncapsulation} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../ngrx/reducers';
import {selectRefreshTokenExpires} from '../../ngrx/selectors/auth.selectors';
import {unixToMoment} from '../../utility/operators/unix-to-moment';
import {filter, map, mergeMap} from 'rxjs/operators';
import * as moment from 'moment';
import {bigIntTimer} from '../../utility/observables/bigint-timer';
import {openRefreshLoginModal} from 'src/app/ngrx/actions/auth.actions';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {
  selectShowCookieAlert,
  selectShowRefreshTokenAboutToExpireAlert
} from '../../ngrx/selectors/app-level-alerts.selectors';
import {cookiesAccepted} from '../../ngrx/actions/app-level-alerts.actions';

@Component({
  selector: 'lc-app-level-alerts',
  templateUrl: './app-level-alerts.component.html',
  styleUrls: ['./app-level-alerts.component.scss'],
   encapsulation: ViewEncapsulation.None
})
@UntilDestroy()
export class AppLevelAlertsComponent {

  public showCookieAlert$: Observable<boolean>;
  public refreshLoginAlertType = 'warning';
  public refreshTokenExpires$: Observable<moment.Moment>;
  public showRefreshTokenAboutToExpireAlert$: Observable<boolean>;


  constructor(private store: Store<AppState>) {
  }

  /**
   * Sets up subscriptions to change the appearance of the alert.
   */
  ngOnInit(): void {
    this.showCookieAlert$ = this.store.pipe(select(selectShowCookieAlert));
    this.showRefreshTokenAboutToExpireAlert$ = this.store.pipe(select(selectShowRefreshTokenAboutToExpireAlert));
    this.refreshTokenExpires$ = this.store.pipe(select(selectRefreshTokenExpires), unixToMoment);
    this.refreshTokenExpires$.pipe(
      filter(refreshTokenExpiresMoment => moment.isMoment(refreshTokenExpiresMoment)), // null when logged out
      map(refreshTokenExpiresMoment => {
        const oneMinuteBeforeExpiry = refreshTokenExpiresMoment.clone().subtract(1, 'minutes');
        return oneMinuteBeforeExpiry.diff(moment(), 'ms');
      }),
      mergeMap(timeDelta => bigIntTimer(timeDelta)),
      untilDestroyed(this)
    ).subscribe(() => {
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
