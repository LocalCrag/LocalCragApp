import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
} from '@angular/core';
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
import { PageTitleComponent } from './page-title/page-title.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AppLevelAlertsComponent } from './app-level-alerts/app-level-alerts.component';
import { OfflineAlertComponent } from './offline-alert/offline-alert.component';
import { MenuComponent } from './menu/menu.component';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { RefreshLoginModalComponent } from './refresh-login-modal/refresh-login-modal.component';
import { Toast } from 'primeng/toast';

/**
 * Application shell: fixed site header, main layout, and global chrome.
 *
 * The header is `position: fixed`; a spacer in the template reserves its height via
 * the `--lc-menu-height` CSS variable (not a template height binding, to avoid
 * change-detection errors after measuring).
 */
@Component({
  selector: 'lc-root',
  templateUrl: './core.component.html',
  styleUrls: ['./core.component.scss'],
  imports: [
    PageTitleComponent,
    SidebarComponent,
    AppLevelAlertsComponent,
    OfflineAlertComponent,
    MenuComponent,
    RouterOutlet,
    FooterComponent,
    RefreshLoginModalComponent,
    Toast,
  ],
})
export class CoreComponent implements OnInit, AfterViewInit, OnDestroy {
  public store = inject<Store<AppState>>(Store);

  @ViewChild('siteHeader')
  private siteHeader?: ElementRef<HTMLElement>;

  /** Slides the fixed header off-screen when the user scrolls down. */
  headerHidden = false;

  /** Measured header height in px; used for scroll hide/show threshold only. */
  headerHeight = 0;

  private readonly hostEl = inject(ElementRef<HTMLElement>);
  private title = inject(Title);
  private resizeObserver?: ResizeObserver;
  private lastScrollY = 0;
  /** Ignore tiny scroll jitter before toggling header visibility. */
  private readonly scrollDeltaMin = 4;
  // Needs to be instantiated here so all router events are tracked
  private _navigationService = inject(NavigationService);

  constructor() {
    // Measure after first render; ViewChild is available and this avoids NG0100.
    afterNextRender(() => this.updateHeaderHeight());

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

  @HostListener('window:resize')
  onResize() {
    this.store.dispatch(checkIsMobile());
    this.updateHeaderHeight();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    const scrollY = window.scrollY;

    // Always show the header near the top of the page.
    if (scrollY <= this.headerHeight) {
      this.headerHidden = false;
      this.lastScrollY = scrollY;
      return;
    }

    const delta = scrollY - this.lastScrollY;

    if (Math.abs(delta) < this.scrollDeltaMin) {
      return;
    }

    if (delta > 0) {
      this.headerHidden = true;
    } else {
      this.headerHidden = false;
    }

    this.lastScrollY = scrollY;
  }

  ngOnInit() {
    this.store.dispatch(tryAutoLogin());
    this.store.dispatch(checkShowCookieAlert());
    this.store.dispatch(checkIsMobile());
  }

  ngAfterViewInit() {
    const headerElement = this.siteHeader?.nativeElement;
    if (!headerElement || typeof ResizeObserver === 'undefined') {
      return;
    }

    // Re-measure when alerts or menu content change the header height.
    this.resizeObserver = new ResizeObserver(() => this.updateHeaderHeight());
    this.resizeObserver.observe(headerElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  /**
   * Syncs measured header height to `--lc-menu-height` for the spacer and other
   * layout (e.g. full-page views that subtract menu height from viewport).
   */
  private updateHeaderHeight() {
    this.headerHeight = this.siteHeader?.nativeElement.offsetHeight ?? 0;
    const heightValue = `${this.headerHeight}px`;
    document.documentElement.style.setProperty('--lc-menu-height', heightValue);
    this.hostEl.nativeElement.style.setProperty(
      '--lc-menu-height',
      heightValue,
    );
  }
}
