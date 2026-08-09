import { Injectable, InjectionToken, inject } from '@angular/core';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Overlay roots that PrimeNG self-closes on Escape.
 *
 * Verified against primeng 21 source: `Dialog` binds a document keydown listener
 * (`closeOnEscape` defaults true) and `Popover.onEscapeKeydown()` is unconditional.
 */
export const OVERLAY_SELECTORS =
  '.p-dialog-mask, .p-popover, .p-confirmdialog, .p-drawer-mask';

/** Injectable exit seam so unit tests never spy on the Capacitor plugin proxy. */
export const EXIT_APP = new InjectionToken<() => void>('EXIT_APP', {
  providedIn: 'root',
  factory: () => () => {
    void App.exitApp();
  },
});

export type BackPressOutcome = 'overlay-dismissed' | 'navigated' | 'exited';

@Injectable({ providedIn: 'root' })
export class HardwareBackButtonService {
  private location = inject(Location);
  private exitApp = inject(EXIT_APP);
  private registered = false;

  /** Registers the Capacitor `backButton` listener once. No-op off native platforms. */
  register(): void {
    if (!Capacitor.isNativePlatform() || this.registered) {
      return;
    }
    this.registered = true;
    void App.addListener('backButton', ({ canGoBack }) => {
      try {
        this.handleBackPress(canGoBack);
      } catch (error) {
        // A thrown error here (e.g. from overlay detection) must never leave
        // the hardware back button permanently unresponsive (T-14-06).
        console.error(
          'HardwareBackButtonService: backButton handling failed',
          error,
        );
      }
    });
  }

  /** Reacts to a single hardware back press: overlay first, then route, then exit. */
  handleBackPress(canGoBack: boolean): BackPressOutcome {
    if (this.dismissTopOverlayIfAny()) {
      return 'overlay-dismissed';
    }
    if (canGoBack) {
      this.location.back();
      return 'navigated';
    }
    this.exitApp();
    return 'exited';
  }

  /** Dispatches a synthetic Escape when an overlay is open. True when handled. */
  dismissTopOverlayIfAny(): boolean {
    if (!document.querySelector(OVERLAY_SELECTORS)) {
      return false;
    }
    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Escape',
        code: 'Escape',
        bubbles: true,
      }),
    );
    return true;
  }
}
