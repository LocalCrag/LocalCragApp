import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import type { RockExplorerDraftRecord } from './rock-explorer-draft.types';
import {
  decideDraftMerge,
  decideOrphanLocalDraft,
  serverDraftTimestampMs,
} from './rock-explorer-draft-reconcile';

function localRecord(
  overrides: Partial<RockExplorerDraftRecord> = {},
): RockExplorerDraftRecord {
  return {
    localId: 'local-1',
    serverId: 'srv-1',
    deviceId: 'dev-a',
    title: 'Draft',
    recordingState: 'paused',
    syncStatus: 'synced',
    updatedAt: 1_000,
    snapshot: {
      feature: {},
      recordingState: 'paused',
      activePathId: null,
      keptSinceSync: 0,
      lastSyncAtMs: 0,
      lastKept: null,
    },
    ...overrides,
  };
}

describe('rock-explorer-draft-reconcile', () => {
  describe('serverDraftTimestampMs', () => {
    it('prefers recordingUpdatedAt over timeUpdated', () => {
      const feature = new RockExplorerFeature();
      feature.recordingUpdatedAt = '2026-08-01T12:00:00';
      feature.timeUpdated = new Date('2026-07-01T12:00:00Z');
      feature.timeCreated = new Date('2026-06-01T12:00:00Z');
      expect(serverDraftTimestampMs(feature)).toBe(
        Date.parse('2026-08-01T12:00:00Z'),
      );
    });

    it('falls back to timeUpdated then timeCreated', () => {
      const feature = new RockExplorerFeature();
      feature.recordingUpdatedAt = null;
      feature.timeUpdated = new Date('2026-07-01T12:00:00Z');
      feature.timeCreated = new Date('2026-06-01T12:00:00Z');
      expect(serverDraftTimestampMs(feature)).toBe(
        Date.parse('2026-07-01T12:00:00Z'),
      );

      feature.timeUpdated = null as unknown as Date;
      expect(serverDraftTimestampMs(feature)).toBe(
        Date.parse('2026-06-01T12:00:00Z'),
      );
    });
  });

  describe('decideDraftMerge', () => {
    it('inserts when there is no local row', () => {
      expect(
        decideDraftMerge({
          local: null,
          serverMs: 2_000,
          hasPendingOps: false,
          isActiveDraft: false,
        }),
      ).toBe('insert');
    });

    it('keeps local when outbound pending or active', () => {
      expect(
        decideDraftMerge({
          local: localRecord({ syncStatus: 'synced' }),
          serverMs: 9_000,
          hasPendingOps: true,
          isActiveDraft: false,
        }),
      ).toBe('keep-local');

      expect(
        decideDraftMerge({
          local: localRecord({ syncStatus: 'error' }),
          serverMs: 9_000,
          hasPendingOps: false,
          isActiveDraft: false,
        }),
      ).toBe('keep-local');

      expect(
        decideDraftMerge({
          local: localRecord({ syncStatus: 'synced' }),
          serverMs: 9_000,
          hasPendingOps: false,
          isActiveDraft: true,
        }),
      ).toBe('keep-local');
    });

    it('replaces when server is newer and local is idle synced', () => {
      expect(
        decideDraftMerge({
          local: localRecord({ updatedAt: 1_000, syncStatus: 'synced' }),
          serverMs: 2_000,
          hasPendingOps: false,
          isActiveDraft: false,
        }),
      ).toBe('replace');
    });

    it('keeps local when timestamps are equal or local is newer', () => {
      expect(
        decideDraftMerge({
          local: localRecord({ updatedAt: 2_000, syncStatus: 'synced' }),
          serverMs: 2_000,
          hasPendingOps: false,
          isActiveDraft: false,
        }),
      ).toBe('keep-local');

      expect(
        decideDraftMerge({
          local: localRecord({ updatedAt: 3_000, syncStatus: 'synced' }),
          serverMs: 2_000,
          hasPendingOps: false,
          isActiveDraft: false,
        }),
      ).toBe('keep-local');
    });
  });

  describe('decideOrphanLocalDraft', () => {
    it('deletes idle synced orphans', () => {
      expect(
        decideOrphanLocalDraft({
          syncStatus: 'synced',
          hasPendingOps: false,
          isActiveDraft: false,
        }),
      ).toBe('delete-local');
    });

    it('keeps orphans with outbound work or active session', () => {
      expect(
        decideOrphanLocalDraft({
          syncStatus: 'pending',
          hasPendingOps: false,
          isActiveDraft: false,
        }),
      ).toBe('keep-local');

      expect(
        decideOrphanLocalDraft({
          syncStatus: 'synced',
          hasPendingOps: true,
          isActiveDraft: false,
        }),
      ).toBe('keep-local');

      expect(
        decideOrphanLocalDraft({
          syncStatus: 'synced',
          hasPendingOps: false,
          isActiveDraft: true,
        }),
      ).toBe('keep-local');
    });
  });
});
