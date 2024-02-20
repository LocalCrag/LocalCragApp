import {Component, HostListener} from '@angular/core';
import {PrimeNGConfig} from 'primeng/api';
import {Store} from '@ngrx/store';
import {AppState} from '../../ngrx/reducers';
import {tryAutoLogin} from '../../ngrx/actions/auth.actions';
import {checkShowCookieAlert} from '../../ngrx/actions/app-level-alerts.actions';
import {checkIsMobile} from '../../ngrx/actions/device.actions';
import {environment} from '../../../environments/environment';
import {Title} from '@angular/platform-browser';
import {marker} from '@ngneat/transloco-keys-manager/marker';

@Component({
  selector: 'lc-root',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss']
})
export class CoreComponent {

  constructor(private primengConfig: PrimeNGConfig,
              private title: Title,
              public store: Store<AppState>) {
    document.documentElement.style.setProperty('--arrow-color', environment.arrowColor);
    document.documentElement.style.setProperty('--arrow-text-color', environment.arrowTextColor);
    document.documentElement.style.setProperty('--arrow-highlight-color', environment.arrowHighlightColor);
    document.documentElement.style.setProperty('--arrow-highlight-text-color', environment.arrowHighlightTextColor);
    this.title.setTitle(environment.instanceName);
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
