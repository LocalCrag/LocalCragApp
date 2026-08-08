import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import {
  RockExplorerRecordingSession,
  getOrCreateRecordingDeviceId,
} from '../rock-explorer-recording';
import {
  decideDraftMerge,
  decideOrphanLocalDraft,
  serverDraftTimestampMs,
} from './rock-explorer-draft-reconcile';
import { RockExplorerDraftStoreService } from './rock-explorer-draft-store.service';
import { RockExplorerDraftSyncService } from './rock-explorer-draft-sync.service';

export type DraftReconcileResult = {
  inserted: number;
  replaced: number;
  deleted: number;
};

export type DraftReconcileOptions = {
  /** Do not overwrite / delete this local draft (open Record session). */
  activeLocalId?: string | null;
  /** Override online check (tests). */
  online?: boolean;
};

/**
 * Pull owner drafts from the API into IndexedDB so Sessions is cross-device.
 * Runs after outbound flush; never clobbers local pending / error / active draft.
 */
@Injectable({
  providedIn: 'root',
})
export class RockExplorerDraftReconcileService {
  private readonly api = inject(RockExplorerService);
  private readonly store = inject(RockExplorerDraftStoreService);
  private readonly sync = inject(RockExplorerDraftSyncService);

  private pullInFlight = false;

  async pullAndMerge(
    options: DraftReconcileOptions = {},
  ): Promise<DraftReconcileResult> {
    const empty: DraftReconcileResult = {
      inserted: 0,
      replaced: 0,
      deleted: 0,
    };
    const online =
      options.online !== undefined ? options.online : this.sync.isOnline();
    if (!online || this.pullInFlight) {
      return empty;
    }

    this.pullInFlight = true;
    try {
      const remote = await firstValueFrom(this.api.listDrafts());
      const result = { ...empty };
      const seenServerIds = new Set<string>();

      for (const feature of remote ?? []) {
        if (!feature?.id) {
          continue;
        }
        seenServerIds.add(feature.id);
        const local = await this.store.getByServerId(feature.id);
        const hasPendingOps = local
          ? await this.store.hasPendingOps(local.localId)
          : false;
        const isActiveDraft =
          !!options.activeLocalId &&
          !!local &&
          local.localId === options.activeLocalId;
        const serverMs = serverDraftTimestampMs(feature);
        const action = decideDraftMerge({
          local,
          serverMs,
          hasPendingOps,
          isActiveDraft,
        });

        if (action === 'insert') {
          await this.writeFromServer(crypto.randomUUID(), feature, serverMs);
          result.inserted += 1;
        } else if (action === 'replace' && local) {
          await this.writeFromServer(local.localId, feature, serverMs);
          result.replaced += 1;
        }
      }

      const locals = await this.store.listByUpdatedAtDesc();
      for (const local of locals) {
        if (!local.serverId || seenServerIds.has(local.serverId)) {
          continue;
        }
        const hasPendingOps = await this.store.hasPendingOps(local.localId);
        const isActiveDraft = local.localId === options.activeLocalId;
        const orphan = decideOrphanLocalDraft({
          syncStatus: local.syncStatus,
          hasPendingOps,
          isActiveDraft,
        });
        if (orphan === 'delete-local') {
          await this.store.deleteLocal(local.localId);
          result.deleted += 1;
        }
      }

      return result;
    } finally {
      this.pullInFlight = false;
    }
  }

  private async writeFromServer(
    localId: string,
    feature: RockExplorerFeature,
    updatedAt: number,
  ): Promise<void> {
    const deviceId =
      feature.recordingDeviceId?.trim() || getOrCreateRecordingDeviceId();
    const session = new RockExplorerRecordingSession(deviceId);
    session.feature = feature;
    session.activePathId = null;
    session.pause();
    await this.store.putSnapshot(localId, session, {
      serverId: feature.id,
      deviceId,
      syncStatus: 'synced',
      recordingState: 'paused',
      title: feature.title ?? null,
      updatedAt,
    });
  }
}
