import { ChangeDetectorRef, DestroyRef, NgZone } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import type { AppPlugin, AppState } from '@capacitor/app';
import { provideMockStore } from '@ngrx/store/testing';
import { Subject } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { selectShowOfflineAlert } from '../../ngrx/selectors/app-level-alerts.selectors';
import { GalleryService } from '../../services/crud/gallery.service';
import { RockExplorerService } from '../../services/crud/rock-explorer.service';
import { UploadService } from '../../services/crud/upload.service';
import { CAPACITOR_APP } from './native-gps/capacitor-app.token';
import {
  RockExplorerRecordingFacade,
  type RockExplorerRecordingFacadeHost,
} from './rock-explorer-recording.facade';
import { RockExplorerUiService } from './rock-explorer-ui.service';
import { RockExplorerDraftReconcileService } from './offline/rock-explorer-draft-reconcile.service';
import { RockExplorerDraftStoreService } from './offline/rock-explorer-draft-store.service';
import {
  RockExplorerDraftSyncService,
  type DeviceLockConflictEvent,
} from './offline/rock-explorer-draft-sync.service';
import { RockExplorerPendingImageService } from './offline/rock-explorer-pending-image.service';
import type { RockExplorerImageLocations } from './map/rock-explorer-image-locations';

describe('RockExplorerRecordingFacade (Wave 0 / GPS-05 + GPS-F01)', () => {
  let facade: RockExplorerRecordingFacade;
  let ui: RockExplorerUiService;
  let capApp: jasmine.SpyObj<AppPlugin>;
  let appStateListener: ((state: AppState) => void) | null;
  let listenerRemove: jasmine.Spy<() => Promise<void>>;
  let draftStore: jasmine.SpyObj<RockExplorerDraftStoreService>;
  let isNativeSpy: jasmine.Spy;

  function buildHost(): RockExplorerRecordingFacadeHost {
    return {
      map: undefined,
      layers: undefined,
      ui,
      images: {} as RockExplorerImageLocations,
      cdr: jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', [
        'detectChanges',
      ]),
      destroyRef: TestBed.inject(DestroyRef),
      ngZone: TestBed.inject(NgZone),
      messageService: jasmine.createSpyObj<MessageService>('MessageService', [
        'add',
      ]),
      confirmationService: jasmine.createSpyObj<ConfirmationService>(
        'ConfirmationService',
        ['confirm'],
      ),
      reloadFeatures: jasmine.createSpy('reloadFeatures'),
      applyFeatureToPanel: jasmine.createSpy('applyFeatureToPanel'),
      openEditPanel: jasmine.createSpy('openEditPanel'),
      closePanel: jasmine.createSpy('closePanel'),
      cancelPathDraw: jasmine.createSpy('cancelPathDraw'),
      setRockExplorerDrawMode: jasmine.createSpy('setRockExplorerDrawMode'),
      fitMapToPositions: jasmine.createSpy('fitMapToPositions'),
      triggerGeolocate: jasmine.createSpy('triggerGeolocate'),
      getRecordImageInputElement: () => undefined,
    };
  }

  beforeEach(() => {
    appStateListener = null;
    listenerRemove = jasmine
      .createSpy('listenerRemove')
      .and.resolveTo(undefined);

    capApp = jasmine.createSpyObj<AppPlugin>('CapacitorApp', [
      'addListener',
      'exitApp',
      'getInfo',
      'getState',
      'getLaunchUrl',
      'minimizeApp',
      'getAppLanguage',
      'toggleBackButtonHandler',
      'removeAllListeners',
    ]);
    capApp.addListener.and.callFake(async (eventName, listenerFunc) => {
      if (eventName === 'appStateChange') {
        appStateListener = listenerFunc as (state: AppState) => void;
      }
      return { remove: listenerRemove } as PluginListenerHandle;
    });

    draftStore = jasmine.createSpyObj<RockExplorerDraftStoreService>(
      'RockExplorerDraftStoreService',
      ['probeOpen'],
    );
    // Avoid init → probe → flush noise; Cap App / visibility tests drive flush.
    draftStore.probeOpen.and.resolveTo(false);

    const draftSync = {
      deviceLockConflict$: new Subject<DeviceLockConflictEvent>(),
    } as unknown as RockExplorerDraftSyncService;

    TestBed.configureTestingModule({
      providers: [
        RockExplorerUiService,
        provideMockStore({
          selectors: [{ selector: selectShowOfflineAlert, value: false }],
        }),
        { provide: CAPACITOR_APP, useValue: capApp },
        { provide: RockExplorerDraftStoreService, useValue: draftStore },
        { provide: RockExplorerDraftSyncService, useValue: draftSync },
        {
          provide: RockExplorerDraftReconcileService,
          useValue: {},
        },
        {
          provide: RockExplorerPendingImageService,
          useValue: {},
        },
        { provide: RockExplorerService, useValue: {} },
        { provide: GalleryService, useValue: {} },
        { provide: UploadService, useValue: {} },
        {
          provide: TranslocoService,
          useValue: { translate: (k: string) => k },
        },
      ],
    });

    ui = TestBed.inject(RockExplorerUiService);
    isNativeSpy = spyOn(Capacitor, 'isNativePlatform').and.returnValue(true);

    facade = TestBed.runInInjectionContext(
      () => new RockExplorerRecordingFacade(buildHost()),
    );
  });

  afterEach(() => {
    facade.destroy();
  });

  describe('GPS-F01 nativeGpsTrackingActive', () => {
    it('defaults to false on RockExplorerUiService', () => {
      expect(ui.nativeGpsTrackingActive()).toBeFalse();
    });

    it('clears nativeGpsTrackingActive on destroy when tracking was active (plan 03)', () => {
      ui.nativeGpsTrackingActive.set(true);
      facade.destroy();
      expect(ui.nativeGpsTrackingActive()).toBeFalse();
    });
  });

  describe('GPS-05 Cap App resume flush (RED until plan 03)', () => {
    it('registers appStateChange on native init and flushes when isActive', async () => {
      const flushSpy = spyOn(facade, 'flushDraftQueue').and.resolveTo();

      facade.init();
      await Promise.resolve();
      await Promise.resolve();

      expect(capApp.addListener).toHaveBeenCalled();
      const lastCall = capApp.addListener.calls.mostRecent();
      expect(lastCall).toBeDefined();
      if (!lastCall) {
        return;
      }
      const [eventName] = lastCall.args as unknown as [string];
      expect(eventName).toBe('appStateChange');
      expect(appStateListener).not.toBeNull();
      if (!appStateListener) {
        return;
      }

      flushSpy.calls.reset();
      appStateListener({ isActive: true });
      expect(flushSpy).toHaveBeenCalled();

      flushSpy.calls.reset();
      appStateListener({ isActive: false });
      expect(flushSpy).not.toHaveBeenCalled();
    });

    it('does not register Cap App listener when not native', async () => {
      isNativeSpy.and.returnValue(false);
      facade.init();
      await Promise.resolve();
      expect(capApp.addListener).not.toHaveBeenCalled();
    });

    it('removes Cap App listener on destroy', async () => {
      facade.init();
      await Promise.resolve();
      await Promise.resolve();
      expect(appStateListener).not.toBeNull();

      facade.destroy();
      expect(listenerRemove).toHaveBeenCalled();
    });

    it('still flushes on visibilitychange when document becomes visible', async () => {
      const flushSpy = spyOn(facade, 'flushDraftQueue').and.resolveTo();
      facade.init();
      await Promise.resolve();
      flushSpy.calls.reset();

      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'visible',
      });
      document.dispatchEvent(new Event('visibilitychange'));

      expect(flushSpy).toHaveBeenCalled();
    });
  });

  it('does not introduce continuous/background HTTP sync helpers', () => {
    // Contract guard for D-15 / T-18-04 — Wave 0 must not invent BG upload APIs.
    expect(
      (facade as unknown as { syncInBackground?: unknown }).syncInBackground,
    ).toBeUndefined();
    expect(
      (facade as unknown as { startBackgroundHttpSync?: unknown })
        .startBackgroundHttpSync,
    ).toBeUndefined();
  });
});
