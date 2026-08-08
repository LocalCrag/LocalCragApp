import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse,
} from '@angular/common/http';
import { Store } from '@ngrx/store';
import { EMPTY, Observable, timer } from 'rxjs';
import {
  catchError,
  exhaustMap,
  finalize,
  switchMap,
  tap,
} from 'rxjs/operators';
import { AppState } from '../../ngrx/reducers';
import { hideOfflineAlert } from '../../ngrx/actions/app-level-alerts.actions';
import { selectShowOfflineAlert } from '../../ngrx/selectors/app-level-alerts.selectors';
import { CONNECTIVITY_PROBE } from '../../utility/http-context/connectivity-probe.context';
import { ApiService } from './api.service';

/**
 * While the offline banner is visible, periodically probes the API so the
 * banner clears when the server is reachable again — not only when an
 * incidental user request succeeds or `window.online` fires.
 *
 * Any HTTP response (including 4xx/5xx) proves the server is reachable;
 * only status 0 / no response keeps the banner up.
 */
@Injectable({
  providedIn: 'root',
})
export class ConnectivityProbeService {
  /** Poll interval while the offline alert is showing. */
  static readonly INTERVAL_MS = 5_000;

  private readonly http = inject(HttpClient);
  private readonly store = inject<Store<AppState>>(Store);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  private probeInFlight = false;

  constructor() {
    this.store
      .select(selectShowOfflineAlert)
      .pipe(
        switchMap((show) =>
          show
            ? timer(0, ConnectivityProbeService.INTERVAL_MS).pipe(
                exhaustMap(() => this.probe$()),
              )
            : EMPTY,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** Immediate probe (e.g. on `window.online`). */
  probeNow(): void {
    this.probe$().subscribe();
  }

  private probe$(): Observable<unknown> {
    if (this.probeInFlight) {
      return EMPTY;
    }
    this.probeInFlight = true;
    return this.http
      .get(this.api.health.check(), {
        observe: 'response',
        context: new HttpContext().set(CONNECTIVITY_PROBE, true),
      })
      .pipe(
        tap(() => this.store.dispatch(hideOfflineAlert())),
        catchError((err: unknown) => {
          // Server answered — network path works even if health is degraded.
          if (err instanceof HttpErrorResponse && err.status !== 0) {
            this.store.dispatch(hideOfflineAlert());
          }
          return EMPTY;
        }),
        finalize(() => {
          this.probeInFlight = false;
        }),
      );
  }
}
