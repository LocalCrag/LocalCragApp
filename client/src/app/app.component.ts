import { Component } from '@angular/core';
import {PrimeNGConfig} from 'primeng/api';
import {Store} from '@ngrx/store';
import {AppState} from './ngrx/reducers';
import {tryAutoLogin} from './ngrx/actions/auth.actions';
import {checkShowCookieAlert} from './ngrx/actions/app-level-alerts.actions';
import {checkIsMobile} from './ngrx/actions/device.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private primengConfig: PrimeNGConfig,
              public store: Store<AppState>) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.store.dispatch(tryAutoLogin());
    this.store.dispatch(checkShowCookieAlert());
    this.store.dispatch(checkIsMobile());
  }

}
