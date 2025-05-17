import { Component, HostListener, OnInit } from '@angular/core';
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
import { NavigationService } from '../../services/core/navigation.service';
import { BackgroundImageComponent } from './background-image/background-image.component';
import { AppLevelAlertsComponent } from './app-level-alerts/app-level-alerts.component';
import { MenuComponent } from './menu/menu.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { RefreshLoginModalComponent } from './refresh-login-modal/refresh-login-modal.component';
import { Toast } from 'primeng/toast';

@Component({
  selector: 'lc-root',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
  imports: [
    BackgroundImageComponent,
    AppLevelAlertsComponent,
    MenuComponent,
    RouterOutlet,
    FooterComponent,
    RefreshLoginModalComponent,
    Toast,
  ],
})
export class CoreComponent implements OnInit {
  constructor(
    private title: Title,
    private navigationService: NavigationService, // Needs to be instantiated here so all router events are tracked
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
    this.store.dispatch(tryAutoLogin());
    this.store.dispatch(checkShowCookieAlert());
    this.store.dispatch(checkIsMobile());
  }
}
