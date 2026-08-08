import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnDestroy,
  afterNextRender,
  inject,
} from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { AppState } from '../../../ngrx/reducers';
import { selectShowOfflineAlert } from '../../../ngrx/selectors/app-level-alerts.selectors';
import { ConnectivityProbeService } from '../../../services/core/connectivity-probe.service';

/**
 * Fixed top banner for connectivity problems.
 *
 * Kept outside the scroll-hiding site header so it stays visible while the navbar hides.
 *
 * ## When to show vs. relying on `window.online` / `offline`
 *
 * The banner is **shown from failed requests** (HTTP status 0, lazy chunk load errors),
 * not from `window.offline` alone. `navigator.onLine` / the `online`/`offline` events
 * only mean the browser thinks it has a network interface — not that our API or static
 * assets are reachable (captive portal, DNS failure, server down, flaky mobile while
 * still "online"). Failed requests prove something the app needed actually broke.
 *
 * ## When to hide
 *
 * - Successful HTTP response — proves the app can talk to the server again
 *   (see ErrorHandlerService / ErrorHandlerInterceptor).
 * - {@link ConnectivityProbeService} — polls `/api/health` while the banner is
 *   visible so recovery is detected even without user-driven requests.
 * - `window.online` — triggers an immediate probe (does not clear blindly).
 */
@Component({
  selector: 'lc-offline-alert',
  templateUrl: './offline-alert.component.html',
  styleUrls: ['./offline-alert.component.scss'],
  imports: [TranslocoDirective, AsyncPipe],
})
export class OfflineAlertComponent implements AfterViewInit, OnDestroy {
  private store = inject<Store<AppState>>(Store);
  private hostEl = inject(ElementRef<HTMLElement>);
  private destroyRef = inject(DestroyRef);
  /** Ensures the root probe service is constructed with the offline banner. */
  private readonly connectivityProbe = inject(ConnectivityProbeService);
  private resizeObserver?: ResizeObserver;

  public showOfflineAlert$: Observable<boolean> = this.store.pipe(
    select(selectShowOfflineAlert),
  );

  constructor() {
    afterNextRender(() => this.updateHeight());

    this.showOfflineAlert$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        // Wait for @if content to render/unrender before measuring.
        requestAnimationFrame(() => this.updateHeight());
      });
  }

  ngAfterViewInit() {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.updateHeight());
    this.resizeObserver.observe(this.hostEl.nativeElement);
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
    document.documentElement.style.setProperty(
      '--lc-offline-alert-height',
      '0px',
    );
  }

  /**
   * Browser reports a network interface again — probe the API rather than
   * clearing blindly (interface up ≠ server reachable).
   */
  @HostListener('window:online')
  onWindowOnline() {
    this.connectivityProbe.probeNow();
  }

  private updateHeight() {
    const height = this.hostEl.nativeElement.offsetHeight ?? 0;
    // Set on :root so core layout (header top + spacer) inherits it.
    document.documentElement.style.setProperty(
      '--lc-offline-alert-height',
      `${height}px`,
    );
  }
}
