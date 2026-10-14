import { Component, HostListener, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { TranslocoDirective } from '@jsverse/transloco';
import { AppState } from '../../../ngrx/reducers';
import { selectShowOfflineAlert } from '../../../ngrx/selectors/app-level-alerts.selectors';
import { ConnectivityProbeService } from '../../../services/core/connectivity-probe.service';

/**
 * Banner for connectivity problems.
 *
 * Rendered by TopAlertsComponent, outside the scroll-hiding site header, so it
 * stays visible while the navbar hides.
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
export class OfflineAlertComponent {
  private store = inject<Store<AppState>>(Store);
  /** Ensures the root probe service is constructed with the offline banner. */
  private readonly connectivityProbe = inject(ConnectivityProbeService);

  public showOfflineAlert$: Observable<boolean> = this.store.pipe(
    select(selectShowOfflineAlert),
  );

  /**
   * Browser reports a network interface again — probe the API rather than
   * clearing blindly (interface up ≠ server reachable).
   */
  @HostListener('window:online')
  onWindowOnline() {
    this.connectivityProbe.probeNow();
  }
}
