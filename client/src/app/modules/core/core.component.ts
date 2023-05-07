import {Component, HostListener} from '@angular/core';
import {PrimeNGConfig} from 'primeng/api';
import {Store} from '@ngrx/store';
import {AppState} from '../../ngrx/reducers';
import {tryAutoLogin} from '../../ngrx/actions/auth.actions';
import {checkShowCookieAlert} from '../../ngrx/actions/app-level-alerts.actions';
import {checkIsMobile} from '../../ngrx/actions/device.actions';

@Component({
  selector: 'lc-root',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss']
})
export class CoreComponent {

  constructor(private primengConfig: PrimeNGConfig,
              public store: Store<AppState>) {
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.store.dispatch(checkIsMobile());
  }

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.store.dispatch(tryAutoLogin());
    this.store.dispatch(checkShowCookieAlert());
    this.store.dispatch(checkIsMobile());
  }

}
