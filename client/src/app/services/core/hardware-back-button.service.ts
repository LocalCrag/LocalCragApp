import { Injectable, InjectionToken, inject } from '@angular/core';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';

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

/* eslint-disable @typescript-eslint/no-unused-vars */
// Removed in 14-03 when the bodies land.
@Injectable({ providedIn: 'root' })
export class HardwareBackButtonService {
  private location = inject(Location);
  private exitApp = inject(EXIT_APP);

  /** Registers the Capacitor `backButton` listener once. No-op off native platforms. */
  register(): void {
    throw new Error('NOT_IMPLEMENTED');
  }

  /** Reacts to a single hardware back press: overlay first, then route, then exit. */
  handleBackPress(canGoBack: boolean): BackPressOutcome {
    throw new Error('NOT_IMPLEMENTED');
  }

  /** Dispatches a synthetic Escape when an overlay is open. True when handled. */
  dismissTopOverlayIfAny(): boolean {
    throw new Error('NOT_IMPLEMENTED');
  }
}
