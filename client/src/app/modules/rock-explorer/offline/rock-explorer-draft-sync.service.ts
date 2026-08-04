import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, firstValueFrom } from 'rxjs';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { RockExplorerRecordingSession } from '../rock-explorer-recording';
import { rockExplorerDraftDb } from './rock-explorer-draft.db';
import { RockExplorerDraftStoreService } from './rock-explorer-draft-store.service';
import type { RockExplorerOpRecord } from './rock-explorer-draft.types';

export type DeviceLockConflictEvent = {
  localId: string;
  serverId: string | null;
};

export type FlushOptions = {
  preferLocalId?: string;
  /** Override online check (tests). */
  online?: boolean;
};

const MAX_TRANSIENT_ATTEMPTS = 5;
const BACKOFF_START_MS = 1000;
const BACKOFF_MAX_MS = 30_000;

/**
 * Coalesced outbound upsert queue + flush against RockExplorerService.
 * Soft multi-tab: per-tab in-flight guard only (no BroadcastChannel).
 */
@Injectable({
  providedIn: 'root',
})
export class RockExplorerDraftSyncService {
  private readonly store = inject(RockExplorerDraftStoreService);
  private readonly api = inject(RockExplorerService);
  private readonly db = rockExplorerDraftDb;

  private flushInFlight = false;

  /** Emitted when HTTP 409 device lock stops drain for a draft (D-08). */
  readonly deviceLockConflict$ = new Subject<DeviceLockConflictEvent>();

  /** Optional hook for host (same as Subject for convenience). */
  onDeviceLockConflict: ((e: DeviceLockConflictEvent) => void) | null = null;

  /** Test seam: replace to skip real delays. */
  delayFn: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  isOnline(): boolean {
    return typeof navigator !== 'undefined' && navigator.onLine;
  }

  /**
   * Ensure at most one upsert op per localId (D-03 coalesce).
   */
  async enqueueUpsert(localId: string): Promise<void> {
    const existing = await this.db.ops.where('localId').equals(localId).first();
    if (existing) {
      await this.db.ops.update(existing.id!, { createdAt: Date.now() });
      return;
    }
    const op: RockExplorerOpRecord = {
      localId,
      kind: 'upsert',
      createdAt: Date.now(),
    };
    await this.db.ops.add(op);
  }

  /**
   * Drain ops FIFO; optional preferLocalId first (Sync now).
   */
  async flush(options: FlushOptions = {}): Promise<void> {
    if (this.flushInFlight) {
      return;
    }
    const online =
      options.online !== undefined ? options.online : this.isOnline();
    if (!online) {
      return;
    }

    this.flushInFlight = true;
    try {
      const ops = await this.orderedOps(options.preferLocalId);
      for (const op of ops) {
        const result = await this.drainOp(op);
        if (result === 'conflict') {
          // Stop further retries for this draft; continue other drafts
          continue;
        }
      }
    } finally {
      this.flushInFlight = false;
    }
  }

  private async orderedOps(
    preferLocalId?: string,
  ): Promise<RockExplorerOpRecord[]> {
    const all = await this.db.ops.orderBy('createdAt').toArray();
    if (!preferLocalId) {
      return all;
    }
    const preferred = all.filter((o) => o.localId === preferLocalId);
    const rest = all.filter((o) => o.localId !== preferLocalId);
    return [...preferred, ...rest];
  }

  private async drainOp(
    op: RockExplorerOpRecord,
  ): Promise<'ok' | 'conflict' | 'failed'> {
    const draft = await this.store.get(op.localId);
    if (!draft) {
      if (op.id != null) {
        await this.db.ops.delete(op.id);
      }
      return 'ok';
    }

    await this.store.patch(op.localId, { syncStatus: 'syncing' });

    let attempt = 0;
    let backoff = BACKOFF_START_MS;

    while (attempt < MAX_TRANSIENT_ATTEMPTS) {
      attempt += 1;
      try {
        await this.pushDraft(draft.localId);
        if (op.id != null) {
          await this.db.ops.delete(op.id);
        }
        await this.store.patch(op.localId, { syncStatus: 'synced' });
        return 'ok';
      } catch (err) {
        if (this.isDeviceLockConflict(err)) {
          const serverId = (await this.store.get(op.localId))?.serverId ?? null;
          await this.store.patch(op.localId, { syncStatus: 'error' });
          const event: DeviceLockConflictEvent = {
            localId: op.localId,
            serverId,
          };
          this.deviceLockConflict$.next(event);
          this.onDeviceLockConflict?.(event);
          // Leave op queued; do not retry this flush cycle
          return 'conflict';
        }
        if (attempt >= MAX_TRANSIENT_ATTEMPTS) {
          await this.store.patch(op.localId, { syncStatus: 'error' });
          return 'failed';
        }
        await this.store.patch(op.localId, { syncStatus: 'pending' });
        await this.delayFn(Math.min(backoff, BACKOFF_MAX_MS));
        backoff = Math.min(backoff * 2, BACKOFF_MAX_MS);
      }
    }

    await this.store.patch(op.localId, { syncStatus: 'error' });
    return 'failed';
  }

  private async pushDraft(localId: string): Promise<void> {
    const draft = await this.store.get(localId);
    if (!draft) {
      return;
    }
    const session = RockExplorerRecordingSession.hydrateFromSnapshot(
      draft.snapshot,
      draft.deviceId,
    );
    const feature = session.feature;
    // HTTP body uses serialize (≥2 verts); keep full paths in IDB snapshot only
    feature.paths = session.pathsForSerialize();
    feature.status = 'draft';
    feature.recordingDeviceId = draft.deviceId;
    feature.recordingState = draft.recordingState;

    if (!draft.serverId) {
      const created = await firstValueFrom(this.api.createFeature(feature));
      await this.store.patch(localId, {
        serverId: created.id,
        syncStatus: 'syncing',
      });
      // Keep live feature id aligned for subsequent updates in same drain
      draft.serverId = created.id;
    } else {
      feature.id = draft.serverId;
      await firstValueFrom(this.api.updateFeature(feature));
    }
  }

  private isDeviceLockConflict(err: unknown): boolean {
    return err instanceof HttpErrorResponse && err.status === 409;
  }
}
