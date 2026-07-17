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
import { hideOfflineAlert } from '../../../ngrx/actions/app-level-alerts.actions';

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
 * - `window.online` — early clear when the OS reports connectivity again (no in-flight
 *   request required). Can fire a bit early relative to real API reachability.
 * - Successful HTTP response — stronger signal that the app can talk to the server again
 *   (see ErrorHandlerService / ErrorHandlerInterceptor).
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
   * Early clear when the browser reports connectivity restored.
   * See class docs: this is a heuristic; successful HTTP is the stronger clear path.
   */
  @HostListener('window:online')
  onWindowOnline() {
    this.store.dispatch(hideOfflineAlert());
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
