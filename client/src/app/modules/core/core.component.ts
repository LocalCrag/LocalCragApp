import { Component, HostListener, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { Store } from '@ngrx/store';
import { AppState } from '../../ngrx/reducers';
import { tryAutoLogin } from '../../ngrx/actions/auth.actions';
import { checkShowCookieAlert } from '../../ngrx/actions/app-level-alerts.actions';
import { checkIsMobile } from '../../ngrx/actions/device.actions';
import { Title } from '@angular/platform-browser';
import {
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';

@Component({
  selector: 'lc-root',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
})
export class CoreComponent implements OnInit {
  constructor(
    private primengConfig: PrimeNGConfig,
    private title: Title,
    public store: Store<AppState>,
  ) {
    const favIcon: HTMLLinkElement = document.querySelector('#favIcon');
    this.store
      .select(selectInstanceSettingsState)
      .subscribe((instanceSettingsState) => {
        document.documentElement.style.setProperty(
          '--arrow-color',
          instanceSettingsState.arrowColor,
        );
        document.documentElement.style.setProperty(
          '--arrow-text-color',
          instanceSettingsState.arrowTextColor,
        );
        document.documentElement.style.setProperty(
          '--arrow-highlight-color',
          instanceSettingsState.arrowHighlightColor,
        );
        document.documentElement.style.setProperty(
          '--arrow-highlight-text-color',
          instanceSettingsState.arrowHighlightTextColor,
        );
        if (instanceSettingsState.faviconImage) {
          favIcon.href = instanceSettingsState.faviconImage.thumbnailS;
        } else {
          favIcon.href = 'assets/lc_logo.svg';
        }
      });
    this.store
      .select(selectInstanceName)
      .pipe(take(1))
      .subscribe((instanceName) => {
        this.title.setTitle(instanceName);
      });
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
