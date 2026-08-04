/** Sync chrome / sessions list status (D-07). */
export type DraftSyncStatus = 'pending' | 'syncing' | 'synced' | 'error';

/**
 * Full local session snapshot for IndexedDB (NOT API serialize).
 * Preserves open 0–1 vertex GPS paths and client-only session fields.
 */
export interface RockExplorerDraftSnapshot {
  /** Plain JSON clone of the feature including all paths. */
  feature: Record<string, unknown>;
  activePathId: string | null;
  keptSinceSync: number;
  lastSyncAtMs: number;
  lastKept: { lng: number; lat: number } | null;
}

/** IndexedDB drafts table row. */
export interface RockExplorerDraftRecord {
  localId: string;
  serverId: string | null;
  deviceId: string;
  title: string | null;
  recordingState: 'recording' | 'paused';
  syncStatus: DraftSyncStatus;
  updatedAt: number;
  snapshot: RockExplorerDraftSnapshot;
}

/**
 * Outbound op queue row — read-at-drain (no heavy payload).
 * Coalesce to at most one upsert per localId.
 */
export interface RockExplorerOpRecord {
  id?: number;
  localId: string;
  kind: 'upsert';
  createdAt: number;
}
