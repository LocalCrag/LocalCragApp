import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { DialogService } from 'primeng/dynamicdialog';
import { firstValueFrom } from 'rxjs';
import {
  LiveSessionResolveDialogComponent,
  LiveSessionResolveResult,
} from '../../modules/core/live-session-resolve-dialog/live-session-resolve-dialog.component';

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
 */
@Injectable({ providedIn: 'root' })
export class RockExplorerLiveSessionGuard {
  private live = false;
  private endHandlers: LiveSessionEndHandlers | null = null;
  private readonly dialogService = inject(DialogService);
  private readonly transloco = inject(TranslocoService);

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
    if (!this.isLive()) {
      await action();
      return;
    }

    const ref = this.dialogService.open(LiveSessionResolveDialogComponent, {
      header: this.transloco.translate(
        marker('rockExplorer.liveSessionGuardHeader'),
      ),
      modal: true,
      closable: true,
      closeOnEscape: true,
      dismissableMask: true,
      width: 'min(420px, 92vw)',
    });

    if (!ref) {
      // Duplicate dialog blocked — treat as Cancel (do not proceed while live).
      return;
    }

    const result = (await firstValueFrom(ref.onClose)) as
      LiveSessionResolveResult | undefined;

    if (result === 'finish') {
      await this.endHandlers?.finish();
      if (!this.isLive()) {
        await action();
      }
      return;
    }

    if (result === 'discard') {
      await this.endHandlers?.discard();
      if (!this.isLive()) {
        await action();
      }
      return;
    }

    // Cancel, mask dismiss, Escape, or undefined — leave session + host unchanged (D-02).
  }
}
