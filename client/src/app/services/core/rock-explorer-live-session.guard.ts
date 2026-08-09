import { Injectable } from '@angular/core';

/** End handlers registered while Rock Explorer Record chrome is live (D-05). */
export type LiveSessionEndHandlers = {
  /** Finish live session — MUST call facade.exitRecordModeAsync() (research resolution #1 / D-03). */
  finish: () => Promise<void>;
  /** Discard active live draft — MUST stop FGS/shim and clear recordModeActive (D-04). */
  discard: () => Promise<void>;
};

/**
 * Root-scoped registry + pending-action runner (D-01…D-08).
 * Predicate = live Record chrome (recordModeActive mirror), INCLUDING paused.
 * Do NOT use hasRecordingSession, Dexie queue, or nativeGpsTrackingActive alone.
 *
 * Wave 0 stub: setLiveSession/isLive track registration; runGuardedAction is
 * NOT_IMPLEMENTED until plan 02 wires DynamicDialog Finish/Discard/Cancel.
 */
@Injectable({ providedIn: 'root' })
export class RockExplorerLiveSessionGuard {
  private live = false;
  private endHandlers: LiveSessionEndHandlers | null = null;

  setLiveSession(active: boolean, handlers?: LiveSessionEndHandlers): void {
    this.live = active;
    this.endHandlers = active ? (handlers ?? null) : null;
  }

  isLive(): boolean {
    return this.live;
  }

  /**
   * If !isLive(): await action() immediately.
   * If live: show Finish/Discard/Cancel resolve UI; Cancel → no action;
   * Finish → await handlers.finish() then action iff !isLive();
   * Discard → await handlers.discard() then action iff !isLive().
   * Never soft-continue while live (D-01).
   */
  async runGuardedAction(action: () => void | Promise<void>): Promise<void> {
    void action;
    void this.endHandlers;
    // Wave 0 stub — plan 02 implements DynamicDialog resolve sequencing (D-01…D-04).
    throw new Error('NOT_IMPLEMENTED');
  }
}
