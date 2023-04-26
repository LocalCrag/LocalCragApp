import {Component, OnInit} from '@angular/core';
import {AppState} from '../../ngrx/reducers';
import {select, Store} from '@ngrx/store';
import {cookiesAccepted} from '../../ngrx/actions/app-level-alerts.actions';
import {selectShowCookieAlert} from '../../ngrx/selectors/app-level-alerts.selectors';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-cookie-consent',
  templateUrl: './cookie-consent.component.html',
  styleUrls: ['./cookie-consent.component.scss']
})
export class CookieConsentComponent implements OnInit{

  public showCookieAlert$: Observable<boolean>;

  constructor(private store: Store<AppState>) {
  }

  ngOnInit() {
    this.showCookieAlert$ = this.store.pipe(select(selectShowCookieAlert));
  }

  /**
   * Notifies the app that cookies were accepted.
   */
  public allowCookies() {
    this.store.dispatch(cookiesAccepted());
  }

}
