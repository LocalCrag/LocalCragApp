import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { rockExplorerDraftDb } from './rock-explorer-draft.db';
import type {
  DraftSyncStatus,
  RockExplorerDraftRecord,
} from './rock-explorer-draft.types';
import {
  RockExplorerRecordingSession,
  type RecordingState,
} from '../rock-explorer-recording';

export type PutSnapshotMeta = {
  serverId?: string | null;
  deviceId?: string;
  syncStatus?: DraftSyncStatus;
  title?: string | null;
  recordingState?: RecordingState;
};

/**
 * IndexedDB CRUD for Rock Explorer offline drafts.
 * providedIn root so Dexie singleton is shared app-wide.
 */
@Injectable({
  providedIn: 'root',
})
export class RockExplorerDraftStoreService {
  private readonly db = rockExplorerDraftDb;

  /**
   * Probe IndexedDB open; false on quota / open failures (D-19).
   */
  async probeOpen(): Promise<boolean> {
    try {
      await this.db.open();
      return true;
    } catch (error) {
      if (this.isStorageFailure(error)) {
        return false;
      }
      return false;
    }
  }

  async putSnapshot(
    localId: string,
    session: RockExplorerRecordingSession,
    meta: PutSnapshotMeta = {},
  ): Promise<RockExplorerDraftRecord> {
    const existing = await this.db.drafts.get(localId);
    const snapshot = session.toSnapshot();
    const deviceId =
      meta.deviceId ??
      session.feature.recordingDeviceId ??
      existing?.deviceId ??
      '';
    const record: RockExplorerDraftRecord = {
      localId,
      serverId:
        meta.serverId !== undefined
          ? meta.serverId
          : (existing?.serverId ?? session.feature.id ?? null),
      deviceId,
      title:
        meta.title !== undefined
          ? meta.title
          : (session.feature.title ?? existing?.title ?? null),
      recordingState:
        meta.recordingState ??
        session.recordingState ??
        existing?.recordingState ??
        'paused',
      syncStatus:
        meta.syncStatus ??
        // Keep error sticky until a successful flush clears it — otherwise every
        // GPS persist would paint the sync button back to pending after a failure.
        (existing?.syncStatus === 'error' ? 'error' : 'pending'),
      updatedAt: Date.now(),
      snapshot,
    };
    // Avoid treating empty string id from new feature as serverId
    if (!record.serverId) {
      record.serverId = null;
    }
    await this.db.drafts.put(record);
    return record;
  }

  async get(localId: string): Promise<RockExplorerDraftRecord | undefined> {
    return this.db.drafts.get(localId);
  }

  async listByUpdatedAtDesc(): Promise<RockExplorerDraftRecord[]> {
    return this.db.drafts.orderBy('updatedAt').reverse().toArray();
  }

  async deleteLocal(localId: string): Promise<void> {
    await this.db.transaction(
      'rw',
      this.db.drafts,
      this.db.ops,
      this.db.pendingImages,
      async () => {
        await this.db.drafts.delete(localId);
        await this.db.ops.where('localId').equals(localId).delete();
        await this.db.pendingImages.where('localId').equals(localId).delete();
      },
    );
  }

  async count(): Promise<number> {
    return this.db.drafts.count();
  }

  async patch(
    localId: string,
    partial: Partial<RockExplorerDraftRecord>,
  ): Promise<void> {
    const existing = await this.db.drafts.get(localId);
    if (!existing) {
      return;
    }
    await this.db.drafts.put({ ...existing, ...partial, localId });
  }

  private isStorageFailure(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }
    const err = error as {
      name?: string;
      inner?: { name?: string };
    };
    const names = [err.name, err.inner?.name].filter(Boolean);
    if (
      names.some(
        (n) =>
          n === 'QuotaExceededError' ||
          n === Dexie.errnames.QuotaExceeded ||
          n === 'OpenFailedError' ||
          n === Dexie.errnames.OpenFailed ||
          n === 'InvalidStateError',
      )
    ) {
      return true;
    }
    return error instanceof Dexie.DexieError;
  }
}

/** Delete the Rock Explorer draft DB (tests / recovery). Next access reopens. */
export async function deleteRockExplorerDraftDb(): Promise<void> {
  await rockExplorerDraftDb.delete();
}
