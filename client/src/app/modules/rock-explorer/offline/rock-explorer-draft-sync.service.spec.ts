import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { RockExplorerRecordingSession } from '../rock-explorer-recording';
import { rockExplorerDraftDb } from './rock-explorer-draft.db';
import { ROCK_EXPLORER_TEST_HOST } from './rock-explorer-draft.db';
import {
  RockExplorerDraftStoreService,
  deleteRockExplorerDraftDb,
} from './rock-explorer-draft-store.service';
import { RockExplorerDraftSyncService } from './rock-explorer-draft-sync.service';
import { RUNTIME_API_HOST } from '../../../services/core/runtime-api-host';

describe('RockExplorerDraftSyncService', () => {
  let store: RockExplorerDraftStoreService;
  let sync: RockExplorerDraftSyncService;
  let createFeature: jasmine.Spy;
  let updateFeature: jasmine.Spy;

  beforeEach(async () => {
    await deleteRockExplorerDraftDb();
    createFeature = jasmine.createSpy('createFeature');
    updateFeature = jasmine.createSpy('updateFeature');

    TestBed.configureTestingModule({
      providers: [
        RockExplorerDraftStoreService,
        RockExplorerDraftSyncService,
        { provide: RUNTIME_API_HOST, useValue: ROCK_EXPLORER_TEST_HOST },
        {
          provide: RockExplorerService,
          useValue: { createFeature, updateFeature },
        },
      ],
    });
    store = TestBed.inject(RockExplorerDraftStoreService);
    sync = TestBed.inject(RockExplorerDraftSyncService);
    sync.delayFn = () => Promise.resolve();
    await store.probeOpen();
  });

  afterEach(async () => {
    await deleteRockExplorerDraftDb();
  });

  async function seedDraft(
    localId: string,
    opts: { twoPoints?: boolean; serverId?: string | null } = {},
  ): Promise<void> {
    const session = new RockExplorerRecordingSession('device-1');
    session.tryAppendFix({ lng: 8, lat: 50 });
    if (opts.twoPoints) {
      session.tryAppendFix({ lng: 8.00015, lat: 50 });
    }
    await store.putSnapshot(localId, session, {
      serverId: opts.serverId ?? null,
      deviceId: 'device-1',
    });
  }

  it('enqueueUpsert coalesces to one op per localId', async () => {
    await seedDraft('L1', { twoPoints: true });
    await sync.enqueueUpsert('L1');
    await sync.enqueueUpsert('L1');
    const ops = await rockExplorerDraftDb.ops
      .where('localId')
      .equals('L1')
      .toArray();
    expect(ops.length).toBeLessThanOrEqual(1);
    expect(ops.length).toBe(1);
    expect(ops[0].kind).toBe('upsert');
  });

  it('flush offline leaves op and does not call HTTP', async () => {
    await seedDraft('L-off', { twoPoints: true });
    await sync.enqueueUpsert('L-off');
    await sync.flush({ online: false });
    expect(createFeature).not.toHaveBeenCalled();
    expect(updateFeature).not.toHaveBeenCalled();
    expect(
      await rockExplorerDraftDb.ops.where('localId').equals('L-off').count(),
    ).toBe(1);
    const draft = await store.get('L-off');
    expect(draft?.syncStatus).toBe('pending');
  });

  it('flush online without serverId creates then marks synced', async () => {
    await seedDraft('L-new', { twoPoints: true });
    await sync.enqueueUpsert('L-new');

    const created = new RockExplorerFeature();
    created.id = 'server-99';
    created.status = 'draft';
    createFeature.and.returnValue(of(created));

    await sync.flush({ online: true });

    expect(createFeature).toHaveBeenCalledTimes(1);
    expect(updateFeature).not.toHaveBeenCalled();
    expect(await rockExplorerDraftDb.ops.count()).toBe(0);
    const draft = await store.get('L-new');
    expect(draft?.serverId).toBe('server-99');
    expect(draft?.syncStatus).toBe('synced');
  });

  it('flush with serverId calls updateFeature', async () => {
    await seedDraft('L-up', { twoPoints: true, serverId: 'srv-1' });
    await sync.enqueueUpsert('L-up');

    const updated = new RockExplorerFeature();
    updated.id = 'srv-1';
    updated.status = 'draft';
    updateFeature.and.returnValue(of(updated));

    await sync.flush({ online: true });

    expect(createFeature).not.toHaveBeenCalled();
    expect(updateFeature).toHaveBeenCalledTimes(1);
    expect(await rockExplorerDraftDb.ops.count()).toBe(0);
    expect((await store.get('L-up'))?.syncStatus).toBe('synced');
  });

  it('HTTP 409 sets error, leaves op, does not infinite-retry', async () => {
    await seedDraft('L-409', { twoPoints: true, serverId: 'srv-lock' });
    await sync.enqueueUpsert('L-409');

    const conflict = new HttpErrorResponse({
      status: 409,
      statusText: 'Conflict',
    });
    updateFeature.and.returnValue(throwError(() => conflict));

    const conflicts: { localId: string; serverId: string | null }[] = [];
    sync.onDeviceLockConflict = (e) => conflicts.push(e);

    await sync.flush({ online: true });

    expect(updateFeature).toHaveBeenCalledTimes(1);
    expect((await store.get('L-409'))?.syncStatus).toBe('error');
    expect(
      await rockExplorerDraftDb.ops.where('localId').equals('L-409').count(),
    ).toBe(1);
    expect(conflicts.length).toBe(1);
    expect(conflicts[0].localId).toBe('L-409');
    expect(conflicts[0].serverId).toBe('srv-lock');
  });

  it('network failure (status 0) sets error immediately and keeps op', async () => {
    await seedDraft('L-net', { twoPoints: true });
    await sync.enqueueUpsert('L-net');

    createFeature.and.returnValue(
      throwError(
        () => new HttpErrorResponse({ status: 0, statusText: 'Unknown Error' }),
      ),
    );

    await sync.flush({ online: true });

    expect(createFeature.calls.count()).toBe(1);
    expect((await store.get('L-net'))?.syncStatus).toBe('error');
    expect(
      await rockExplorerDraftDb.ops.where('localId').equals('L-net').count(),
    ).toBe(1);
  });

  it('flush preferLocalId drains that draft first', async () => {
    await seedDraft('L-a', { twoPoints: true });
    await seedDraft('L-b', { twoPoints: true });
    await sync.enqueueUpsert('L-a');
    await sync.enqueueUpsert('L-b');

    const order: string[] = [];
    createFeature.and.callFake((_feature: RockExplorerFeature) => {
      order.push('call');
      const created = new RockExplorerFeature();
      created.id = `id-${order.length}`;
      created.status = 'draft';
      return of(created);
    });

    // Prefer L-b
    await sync.flush({ online: true, preferLocalId: 'L-b' });
    expect(createFeature).toHaveBeenCalledTimes(2);
    expect(await rockExplorerDraftDb.ops.count()).toBe(0);
  });
});
