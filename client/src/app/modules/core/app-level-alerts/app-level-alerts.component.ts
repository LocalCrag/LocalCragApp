import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AppState } from '../../../ngrx/reducers';

import { selectShowCookieAlert } from '../../../ngrx/selectors/app-level-alerts.selectors';
import { cookiesAccepted } from '../../../ngrx/actions/app-level-alerts.actions';
import { TranslocoDirective } from '@jsverse/transloco';
import { AsyncPipe } from '@angular/common';
import { Button } from 'primeng/button';

@Component({
  selector: 'lc-app-level-alerts',
  templateUrl: './app-level-alerts.component.html',
  styleUrls: ['./app-level-alerts.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [TranslocoDirective, AsyncPipe, Button],
})
export class AppLevelAlertsComponent implements OnInit {
  public showCookieAlert$: Observable<boolean>;

  private store = inject<Store<AppState>>(Store);

  /**
   * Sets up subscriptions for cookie alert visibility.
   */
  ngOnInit(): void {
    this.showCookieAlert$ = this.store.pipe(select(selectShowCookieAlert));
  }

  /**
   * Notifies the app that cookies were accepted.
   */
  public allowCookies() {
    this.store.dispatch(cookiesAccepted());
  }
}
