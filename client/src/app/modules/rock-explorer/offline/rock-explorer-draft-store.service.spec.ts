import { TestBed } from '@angular/core/testing';
import { RockExplorerRecordingSession } from '../rock-explorer-recording';
import {
  RockExplorerDraftStoreService,
  deleteRockExplorerDraftDb,
} from './rock-explorer-draft-store.service';
import {
  LEGACY_ROCK_EXPLORER_DB_NAME,
  ROCK_EXPLORER_TEST_HOST,
  rockExplorerDbName,
} from './rock-explorer-draft.db';
import { RUNTIME_API_HOST } from '../../../services/core/runtime-api-host';

describe('RockExplorerDraftStoreService', () => {
  let store: RockExplorerDraftStoreService;

  beforeEach(async () => {
    await deleteRockExplorerDraftDb();
    TestBed.configureTestingModule({
      providers: [
        RockExplorerDraftStoreService,
        { provide: RUNTIME_API_HOST, useValue: ROCK_EXPLORER_TEST_HOST },
      ],
    });
    store = TestBed.inject(RockExplorerDraftStoreService);
    await store.probeOpen();
  });

  afterEach(async () => {
    await deleteRockExplorerDraftDb();
  });

  it('probeOpen resolves true when IndexedDB works', async () => {
    expect(await store.probeOpen()).toBeTrue();
  });

  it('putSnapshot writes pending draft and count reflects rows', async () => {
    const session = new RockExplorerRecordingSession('dev-a');
    session.tryAppendFix({ lng: 8, lat: 50 });
    session.feature.title = 'Crag A';

    const record = await store.putSnapshot('local-1', session);
    expect(record.localId).toBe('local-1');
    expect(record.syncStatus).toBe('pending');
    expect(record.title).toBe('Crag A');
    expect(record.deviceId).toBe('dev-a');
    expect(record.updatedAt).toBeGreaterThan(0);
    expect(record.snapshot.activePathId).toBe(session.activePathId);
    expect(
      (
        record.snapshot.feature['paths'] as {
          geometry: { coordinates: unknown[] };
        }[]
      )[0].geometry.coordinates.length,
    ).toBe(1);

    expect(await store.count()).toBe(1);
    const got = await store.get('local-1');
    expect(got?.title).toBe('Crag A');
  });

  it('listByUpdatedAtDesc orders newest first', async () => {
    const s1 = new RockExplorerRecordingSession('d');
    const s2 = new RockExplorerRecordingSession('d');
    await store.putSnapshot('a', s1);
    await new Promise((r) => setTimeout(r, 5));
    await store.putSnapshot('b', s2);
    const list = await store.listByUpdatedAtDesc();
    expect(list.map((d) => d.localId)).toEqual(['b', 'a']);
  });

  it('deleteLocal removes draft and ops for localId', async () => {
    const session = new RockExplorerRecordingSession('d');
    await store.putSnapshot('x', session);
    const { rockExplorerDraftDb } = await import('./rock-explorer-draft.db');
    await rockExplorerDraftDb.ops.add({
      localId: 'x',
      kind: 'upsert',
      createdAt: Date.now(),
    });
    await store.deleteLocal('x');
    expect(await store.get('x')).toBeUndefined();
    expect(
      await rockExplorerDraftDb.ops.where('localId').equals('x').count(),
    ).toBe(0);
  });

  it('patch updates syncStatus', async () => {
    const session = new RockExplorerRecordingSession('d');
    await store.putSnapshot('p', session);
    await store.patch('p', { syncStatus: 'synced', serverId: 'srv-1' });
    const got = await store.get('p');
    expect(got?.syncStatus).toBe('synced');
    expect(got?.serverId).toBe('srv-1');
  });

  it('putSnapshot preserves error syncStatus until explicitly cleared', async () => {
    const session = new RockExplorerRecordingSession('d');
    await store.putSnapshot('err', session);
    await store.patch('err', { syncStatus: 'error' });
    session.tryAppendFix({ lng: 1, lat: 2 });
    const again = await store.putSnapshot('err', session);
    expect(again.syncStatus).toBe('error');
    const cleared = await store.putSnapshot('err', session, {
      syncStatus: 'pending',
    });
    expect(cleared.syncStatus).toBe('pending');
  });

  it('getByServerId finds draft and putSnapshot can preserve updatedAt', async () => {
    const session = new RockExplorerRecordingSession('d');
    const updatedAt = 1_700_000_000_000;
    await store.putSnapshot('by-srv', session, {
      serverId: 'server-42',
      syncStatus: 'synced',
      updatedAt,
    });
    const found = await store.getByServerId('server-42');
    expect(found?.localId).toBe('by-srv');
    expect(found?.updatedAt).toBe(updatedAt);
  });

  it('uses host-scoped DB name derived from RUNTIME_API_HOST', () => {
    expect(rockExplorerDbName(ROCK_EXPLORER_TEST_HOST)).toBe(
      `${LEGACY_ROCK_EXPLORER_DB_NAME}:${ROCK_EXPLORER_TEST_HOST}`,
    );
  });
});
