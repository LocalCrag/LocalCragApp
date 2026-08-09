import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { RockExplorerRecordingSession } from '../rock-explorer-recording';
import {
  rockExplorerDraftDb,
  ROCK_EXPLORER_TEST_HOST,
} from './rock-explorer-draft.db';
import { RockExplorerDraftReconcileService } from './rock-explorer-draft-reconcile.service';
import {
  RockExplorerDraftStoreService,
  deleteRockExplorerDraftDb,
} from './rock-explorer-draft-store.service';
import { RockExplorerDraftSyncService } from './rock-explorer-draft-sync.service';
import { RUNTIME_API_HOST } from '../../../services/core/runtime-api-host';

function remoteDraft(opts: {
  id: string;
  title: string;
  recordingUpdatedAt: string;
  deviceId?: string;
}): RockExplorerFeature {
  const feature = new RockExplorerFeature();
  feature.id = opts.id;
  feature.title = opts.title;
  feature.status = 'draft';
  feature.recordingDeviceId = opts.deviceId ?? 'remote-device';
  feature.recordingUpdatedAt = opts.recordingUpdatedAt;
  feature.timeCreated = new Date('2026-01-01T00:00:00Z');
  feature.timeUpdated = new Date(opts.recordingUpdatedAt + 'Z');
  feature.paths = [];
  feature.parkingSites = [];
  feature.accessIssues = [];
  feature.topoLinks = [];
  feature.geometry = null;
  return feature;
}

describe('RockExplorerDraftReconcileService', () => {
  let store: RockExplorerDraftStoreService;
  let reconcile: RockExplorerDraftReconcileService;
  let listDrafts: jasmine.Spy;

  beforeEach(async () => {
    await deleteRockExplorerDraftDb();
    listDrafts = jasmine.createSpy('listDrafts').and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [
        RockExplorerDraftStoreService,
        RockExplorerDraftSyncService,
        RockExplorerDraftReconcileService,
        { provide: RUNTIME_API_HOST, useValue: ROCK_EXPLORER_TEST_HOST },
        {
          provide: RockExplorerService,
          useValue: { listDrafts },
        },
      ],
    });
    store = TestBed.inject(RockExplorerDraftStoreService);
    reconcile = TestBed.inject(RockExplorerDraftReconcileService);
    await store.probeOpen();
  });

  afterEach(async () => {
    await deleteRockExplorerDraftDb();
  });

  it('inserts remote drafts missing from IndexedDB', async () => {
    listDrafts.and.returnValue(
      of([
        remoteDraft({
          id: 'srv-new',
          title: 'From server',
          recordingUpdatedAt: '2026-08-01T10:00:00',
        }),
      ]),
    );

    const result = await reconcile.pullAndMerge({ online: true });
    expect(result.inserted).toBe(1);
    expect(result.replaced).toBe(0);

    const local = await store.getByServerId('srv-new');
    expect(local?.title).toBe('From server');
    expect(local?.syncStatus).toBe('synced');
    expect(local?.recordingState).toBe('paused');
    expect(local?.updatedAt).toBe(Date.parse('2026-08-01T10:00:00Z'));
  });

  it('replaces idle synced local when server is newer', async () => {
    const session = new RockExplorerRecordingSession('dev-a');
    session.feature.title = 'Old local';
    await store.putSnapshot('L1', session, {
      serverId: 'srv-1',
      syncStatus: 'synced',
      updatedAt: Date.parse('2026-07-01T00:00:00Z'),
      title: 'Old local',
    });

    listDrafts.and.returnValue(
      of([
        remoteDraft({
          id: 'srv-1',
          title: 'Newer server',
          recordingUpdatedAt: '2026-08-01T00:00:00',
        }),
      ]),
    );

    const result = await reconcile.pullAndMerge({ online: true });
    expect(result.replaced).toBe(1);
    const local = await store.get('L1');
    expect(local?.title).toBe('Newer server');
    expect(local?.syncStatus).toBe('synced');
  });

  it('keeps local with pending ops even when server is newer', async () => {
    const session = new RockExplorerRecordingSession('dev-a');
    session.feature.title = 'Unsynced local';
    await store.putSnapshot('L2', session, {
      serverId: 'srv-2',
      syncStatus: 'synced',
      updatedAt: Date.parse('2026-07-01T00:00:00Z'),
      title: 'Unsynced local',
    });
    await rockExplorerDraftDb.ops.add({
      localId: 'L2',
      kind: 'upsert',
      createdAt: Date.now(),
    });

    listDrafts.and.returnValue(
      of([
        remoteDraft({
          id: 'srv-2',
          title: 'Server version',
          recordingUpdatedAt: '2026-08-01T00:00:00',
        }),
      ]),
    );

    const result = await reconcile.pullAndMerge({ online: true });
    expect(result.replaced).toBe(0);
    expect((await store.get('L2'))?.title).toBe('Unsynced local');
  });

  it('deletes synced local orphan no longer on server', async () => {
    const session = new RockExplorerRecordingSession('dev-a');
    await store.putSnapshot('L-orphan', session, {
      serverId: 'srv-gone',
      syncStatus: 'synced',
      updatedAt: Date.now(),
    });
    listDrafts.and.returnValue(of([]));

    const result = await reconcile.pullAndMerge({ online: true });
    expect(result.deleted).toBe(1);
    expect(await store.get('L-orphan')).toBeUndefined();
  });

  it('skips pull when offline', async () => {
    listDrafts.and.returnValue(
      of([
        remoteDraft({
          id: 'srv-x',
          title: 'X',
          recordingUpdatedAt: '2026-08-01T00:00:00',
        }),
      ]),
    );
    const result = await reconcile.pullAndMerge({ online: false });
    expect(result.inserted).toBe(0);
    expect(listDrafts).not.toHaveBeenCalled();
  });
});
