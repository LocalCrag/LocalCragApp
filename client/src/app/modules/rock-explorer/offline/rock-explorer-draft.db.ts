import Dexie, { type EntityTable } from 'dexie';
import type {
  RockExplorerDraftRecord,
  RockExplorerOpRecord,
} from './rock-explorer-draft.types';

export const ROCK_EXPLORER_DB_NAME = 'localcrag.rockExplorer';

export type RockExplorerDraftDb = Dexie & {
  drafts: EntityTable<RockExplorerDraftRecord, 'localId'>;
  ops: EntityTable<RockExplorerOpRecord, 'id'>;
};

/** Singleton Dexie DB for Rock Explorer offline drafts + outbox. */
export const rockExplorerDraftDb = new Dexie(
  ROCK_EXPLORER_DB_NAME,
) as RockExplorerDraftDb;

rockExplorerDraftDb.version(1).stores({
  drafts: 'localId, serverId, updatedAt, syncStatus, deviceId',
  ops: '++id, localId, createdAt',
});
