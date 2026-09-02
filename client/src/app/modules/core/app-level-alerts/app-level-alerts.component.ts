import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  merge,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';

import { selectShowCookieAlert } from '../../../ngrx/selectors/app-level-alerts.selectors';
import { cookiesAccepted } from '../../../ngrx/actions/app-level-alerts.actions';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import { TranslocoDirective } from '@jsverse/transloco';
import { AsyncPipe } from '@angular/common';
import { Button } from 'primeng/button';
import { AppAlertsService } from '../../../services/crud/app-alerts.service';
import { AppAlertDismissalService } from '../../../services/crud/app-alert-dismissal.service';
import { AppAlert } from '../../../models/app-alert';

@Component({
  selector: 'lc-app-level-alerts',
  templateUrl: './app-level-alerts.component.html',
  styleUrls: ['./app-level-alerts.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [TranslocoDirective, AsyncPipe, Button],
})
export class AppLevelAlertsComponent implements OnInit {
  public showCookieAlert$: Observable<boolean>;
  public adminAlerts$: Observable<AppAlert[]>;

  private store = inject<Store<AppState>>(Store);
  private appAlertsService = inject(AppAlertsService);
  private appAlertDismissalService = inject(AppAlertDismissalService);

  ngOnInit(): void {
    this.showCookieAlert$ = this.store.pipe(select(selectShowCookieAlert));
    this.adminAlerts$ = combineLatest([
      merge(of(undefined), this.appAlertsService.alertsChanged$),
      this.store.pipe(select(selectIsLoggedIn), distinctUntilChanged()),
    ]).pipe(
      switchMap(() => this.appAlertsService.getActiveAlerts()),
      switchMap((alerts) =>
        this.appAlertDismissalService.filterVisibleAlerts(alerts),
      ),
    );
  }

  public allowCookies() {
    this.store.dispatch(cookiesAccepted());
  }

  public dismissAdminAlert(alert: AppAlert) {
    this.appAlertDismissalService.dismiss(alert).subscribe(() => {
      this.appAlertsService.notifyAlertsChanged();
    });
  }
}
