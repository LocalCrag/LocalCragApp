import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  RockExplorerDraftStoreService,
  deleteRockExplorerDraftDb,
} from './rock-explorer-draft-store.service';
import { RockExplorerPendingImageService } from './rock-explorer-pending-image.service';
import { RockExplorerRecordingSession } from '../rock-explorer-recording';
import { rockExplorerDraftDb } from './rock-explorer-draft.db';

describe('RockExplorerPendingImageService', () => {
  let pending: RockExplorerPendingImageService;
  let store: RockExplorerDraftStoreService;

  beforeEach(async () => {
    await deleteRockExplorerDraftDb();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        RockExplorerPendingImageService,
        RockExplorerDraftStoreService,
      ],
    });
    pending = TestBed.inject(RockExplorerPendingImageService);
    store = TestBed.inject(RockExplorerDraftStoreService);
    await store.probeOpen();
  });

  afterEach(async () => {
    await deleteRockExplorerDraftDb();
  });

  it('enqueue stores blob coords and listGpsPins returns them', async () => {
    const blob = new Blob(['img'], { type: 'image/jpeg' });
    const id = await pending.enqueue('local-1', blob, 50.1, 8.2, 'a.jpg');
    expect(id).toBeTruthy();
    const pins = await pending.listGpsPins('local-1');
    expect(pins).toEqual([{ lat: 50.1, lng: 8.2 }]);
    const row = await rockExplorerDraftDb.pendingImages.get(id);
    expect(row?.fileName).toBe('a.jpg');
    expect(row?.blob.size).toBe(blob.size);
  });

  it('deleteLocal cascades pending images', async () => {
    const session = new RockExplorerRecordingSession('d');
    await store.putSnapshot('x', session);
    await pending.enqueue('x', new Blob(['x']), 1, 2);
    expect((await pending.listGpsPins('x')).length).toBe(1);
    await store.deleteLocal('x');
    expect((await pending.listGpsPins('x')).length).toBe(0);
  });

  it('deleteForLocalId clears queue without removing draft', async () => {
    const session = new RockExplorerRecordingSession('d');
    await store.putSnapshot('y', session);
    await pending.enqueue('y', new Blob(['y']), 3, 4);
    await pending.deleteForLocalId('y');
    expect((await pending.listGpsPins('y')).length).toBe(0);
    expect(await store.get('y')).toBeTruthy();
  });
});
