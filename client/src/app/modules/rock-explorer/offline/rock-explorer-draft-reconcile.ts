import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { parseServerUtcDate } from '../../../utility/parse-server-utc-date';
import type {
  DraftSyncStatus,
  RockExplorerDraftRecord,
} from './rock-explorer-draft.types';

export type DraftMergeAction = 'insert' | 'replace' | 'keep-local';

export type DraftOrphanAction = 'delete-local' | 'keep-local';

/**
 * Prefer recordingUpdatedAt, then timeUpdated / timeCreated (ms since epoch).
 */
export function serverDraftTimestampMs(feature: RockExplorerFeature): number {
  const candidates: Array<string | Date | null | undefined> = [
    feature.recordingUpdatedAt,
    feature.timeUpdated,
    feature.timeCreated,
  ];
  for (const c of candidates) {
    if (c == null || c === '') {
      continue;
    }
    if (c instanceof Date) {
      const ms = c.getTime();
      if (!Number.isNaN(ms)) {
        return ms;
      }
      continue;
    }
    const parsed = parseServerUtcDate(c);
    if (parsed) {
      return parsed.getTime();
    }
  }
  return 0;
}

/**
 * Decide how to merge one server draft into a matching (or missing) local row.
 *
 * Never clobber outbound work: pending ops, pending/syncing/error status, or the
 * draft currently open in Record mode.
 */
export function decideDraftMerge(args: {
  local: RockExplorerDraftRecord | null | undefined;
  serverMs: number;
  hasPendingOps: boolean;
  isActiveDraft: boolean;
}): DraftMergeAction {
  if (!args.local) {
    return 'insert';
  }
  if (args.isActiveDraft || args.hasPendingOps) {
    return 'keep-local';
  }
  if (isOutboundSyncStatus(args.local.syncStatus)) {
    return 'keep-local';
  }
  if (args.serverMs > args.local.updatedAt) {
    return 'replace';
  }
  return 'keep-local';
}

/**
 * Local draft with a serverId that is no longer in the owner's draft list
 * (published or deleted remotely). Only drop when fully synced and idle.
 */
export function decideOrphanLocalDraft(args: {
  syncStatus: DraftSyncStatus;
  hasPendingOps: boolean;
  isActiveDraft: boolean;
}): DraftOrphanAction {
  if (args.isActiveDraft || args.hasPendingOps) {
    return 'keep-local';
  }
  if (isOutboundSyncStatus(args.syncStatus)) {
    return 'keep-local';
  }
  return 'delete-local';
}

function isOutboundSyncStatus(status: DraftSyncStatus): boolean {
  return status === 'pending' || status === 'syncing' || status === 'error';
}
