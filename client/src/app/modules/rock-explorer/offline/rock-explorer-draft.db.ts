import Dexie, { type EntityTable } from 'dexie';
import { normalizeApiHostUrl } from '../../../services/core/runtime-api-host';
import type {
  RockExplorerDraftRecord,
  RockExplorerOpRecord,
  RockExplorerPendingImageRecord,
} from './rock-explorer-draft.types';

/** Pre-Phase-16 unscoped DB name. */
export const LEGACY_ROCK_EXPLORER_DB_NAME = 'localcrag.rockExplorer';

/** Stable host used by unit tests that touch IndexedDB directly. */
export const ROCK_EXPLORER_TEST_HOST = 'http://test.localcrag';

export type RockExplorerDraftDb = Dexie & {
  drafts: EntityTable<RockExplorerDraftRecord, 'localId'>;
  ops: EntityTable<RockExplorerOpRecord, 'id'>;
  pendingImages: EntityTable<RockExplorerPendingImageRecord, 'id'>;
};

const dbCache = new Map<string, RockExplorerDraftDb>();

export function rockExplorerDbName(apiHost: string): string {
  return `${LEGACY_ROCK_EXPLORER_DB_NAME}:${normalizeApiHostUrl(apiHost)}`;
}

function createRockExplorerDraftDb(name: string): RockExplorerDraftDb {
  const db = new Dexie(name) as RockExplorerDraftDb;
  db.version(1).stores({
    drafts: 'localId, serverId, updatedAt, syncStatus, deviceId',
    ops: '++id, localId, createdAt',
  });
  db.version(2).stores({
    drafts: 'localId, serverId, updatedAt, syncStatus, deviceId',
    ops: '++id, localId, createdAt',
    pendingImages: 'id, localId, createdAt',
  });
  return db;
}

/**
 * Open (or reuse) the Dexie DB for an API host (INST-05 / D-09).
 */
export function openRockExplorerDraftDb(apiHost: string): RockExplorerDraftDb {
  const name = rockExplorerDbName(apiHost);
  let db = dbCache.get(name);
  if (!db) {
    db = createRockExplorerDraftDb(name);
    dbCache.set(name, db);
  }
  return db;
}

/**
 * Copy legacy unscoped DB into the active host DB once, then delete legacy.
 */
export async function migrateLegacyRockExplorerDbIfNeeded(
  apiHost: string,
): Promise<void> {
  const target = openRockExplorerDraftDb(apiHost);
  await target.open();
  const targetCount =
    (await target.drafts.count()) +
    (await target.ops.count()) +
    (await target.pendingImages.count());
  if (targetCount > 0) {
    return;
  }

  const legacyExists = await Dexie.exists(LEGACY_ROCK_EXPLORER_DB_NAME);
  if (!legacyExists) {
    return;
  }

  const legacy = createRockExplorerDraftDb(LEGACY_ROCK_EXPLORER_DB_NAME);
  await legacy.open();
  const legacyCount =
    (await legacy.drafts.count()) +
    (await legacy.ops.count()) +
    (await legacy.pendingImages.count());
  if (legacyCount === 0) {
    legacy.close();
    await Dexie.delete(LEGACY_ROCK_EXPLORER_DB_NAME);
    return;
  }

  await target.transaction(
    'rw',
    target.drafts,
    target.ops,
    target.pendingImages,
    async () => {
      await target.drafts.bulkPut(await legacy.drafts.toArray());
      await target.ops.bulkPut(await legacy.ops.toArray());
      await target.pendingImages.bulkPut(await legacy.pendingImages.toArray());
    },
  );
  legacy.close();
  await Dexie.delete(LEGACY_ROCK_EXPLORER_DB_NAME);
}

/**
 * Back-compat export for specs that import the module singleton.
 * Production services must call openRockExplorerDraftDb(RUNTIME_API_HOST).
 */
export const rockExplorerDraftDb = openRockExplorerDraftDb(
  ROCK_EXPLORER_TEST_HOST,
);
