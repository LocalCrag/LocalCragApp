import { ChangeDetectorRef, DestroyRef, NgZone, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Store } from '@ngrx/store';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { firstValueFrom } from 'rxjs';
import { Map as MaplibreMap } from 'maplibre-gl';
import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { selectShowOfflineAlert } from '../../ngrx/selectors/app-level-alerts.selectors';
import { RockExplorerFeature } from '../../models/rock-explorer-feature';
import { GalleryImage } from '../../models/gallery-image';
import { Tag } from '../../models/tag';
import { ObjectType } from '../../models/object';
import { RockExplorerPotential } from '../../enums/rock-explorer-potential';
import { RockExplorerService } from '../../services/crud/rock-explorer.service';
import { GalleryService } from '../../services/crud/gallery.service';
import { UploadService } from '../../services/crud/upload.service';
import {
  geometryForPublishFromOverlays,
  geometryFromOverlayPoints,
} from '../../utility/geo/convex-hull';
import { emptyFeatureCollection } from '../../utility/map/geojson-source';
import { fitMapToGeometry } from '../../utility/map/map-bounds';
import { geometryLabelPoint } from '../../utility/map/geometry-label-point';
import { RockExplorerImageLocations } from './map/rock-explorer-image-locations';
import { RockExplorerMapLayers } from './map/rock-explorer-map-layers';
import {
  RockExplorerDrawMode,
  RockExplorerUiService,
} from './rock-explorer-ui.service';
import {
  RockExplorerRecordingSession,
  getOrCreateRecordingDeviceId,
} from './rock-explorer-recording';
import type { RockExplorerMockGpsService } from './rock-explorer-mock-gps.service';
import { loadMockGps } from './rock-explorer-mock-gps.loader';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { mockGpsRecording } from '../../../environments/environment';
import { uninstallNativeGpsShim } from './native-gps/rock-explorer-native-gps.shim';
import { CAPACITOR_APP } from './native-gps/capacitor-app.token';
import { GpsBridge } from './native-gps/gps-bridge';
import { ensureRockExplorerTrackingPermissions } from './native-gps/rock-explorer-gps-permissions';
import type { RockExplorerDraftRecord } from './offline/rock-explorer-draft.types';
import { RockExplorerDraftStoreService } from './offline/rock-explorer-draft-store.service';
import {
  DeviceLockConflictEvent,
  RockExplorerDraftSyncService,
} from './offline/rock-explorer-draft-sync.service';
import { RockExplorerDraftReconcileService } from './offline/rock-explorer-draft-reconcile.service';
import { RockExplorerPendingImageService } from './offline/rock-explorer-pending-image.service';
import { RockExplorerLiveSessionGuard } from '../../services/core/rock-explorer-live-session.guard';

/**
 * Component behaviors the facade calls back into. Kept intentionally small —
 * most read-state (draw mode, panel open, record signals, ...) flows through
 * `ui` directly instead of being duplicated here.
 */
export type RockExplorerRecordingFacadeHost = {
  map: MaplibreMap | undefined;
  layers: RockExplorerMapLayers | undefined;
  ui: RockExplorerUiService;
  /** Gallery / draft / live-record image GPS dots on the map. */
  images: RockExplorerImageLocations;
  cdr: ChangeDetectorRef;
  destroyRef: DestroyRef;
  ngZone: NgZone;
  messageService: MessageService;
  confirmationService: ConfirmationService;

  /** Re-fetch + re-render the feature list (current filters live on host). */
  reloadFeatures: () => void;
  /** Hydrate the feature panel from an already-loaded feature (edit form / after save/publish). */
  applyFeatureToPanel: (
    feature: RockExplorerFeature,
    formActive: boolean,
  ) => void;
  /** Fetch + open the feature panel for an existing feature id. */
  openEditPanel: (id: string, options?: { focus?: boolean }) => void;
  /** Close the open feature panel. */
  closePanel: (options?: { skipUrlSync?: boolean }) => void;
  /** Cancel an in-progress misc-panel path draw. */
  cancelPathDraw: () => void;
  /** Reset the point/polygon draw tool to `select` (Record and draw tools are exclusive). */
  setRockExplorerDrawMode: (mode: RockExplorerDrawMode) => void;
  /** Fit the map viewport to raw positions (paths without a full polygon geometry yet). */
  fitMapToPositions: (positions: Position[]) => void;
  /** Trigger MapLibre's GeolocateControl (native "locate me" pulse on Resume). */
  triggerGeolocate: () => void;
  /** Hidden `<input type="file">` backing the Record "add photo" toolbar action. */
  getRecordImageInputElement: () => HTMLInputElement | undefined;
};

/**
 * Owns Rock Explorer Record mode end-to-end: the live GPS recording session,
 * local IndexedDB drafts (persist/list/delete), publish, background
 * sync/reconcile with device-lock handling, and (dev-only) mock GPS.
 *
 * Plain class (like {@link RockExplorerImageLocations}) — instantiate with
 * `new` from the host component's constructor so root-provided services can
 * be `inject()`-ed here directly. Component-scoped concerns (map, layers,
 * ui, cdr, destroyRef, ngZone, panel/messages, and the handful of shared
 * behaviors below) come from `host`.
 *
 * Host wiring (not yet done — see task):
 * - call {@link init} once from `ngAfterViewInit`
 * - call {@link destroy} from `ngOnDestroy`
 * - call {@link ensureMockGps} from `initMap` to install the navigator shim
 * - forward `handleUiCommand` record/draft/publish cases to the matching
 *   public methods below
 */
export class RockExplorerRecordingFacade {
  private readonly draftStore = inject(RockExplorerDraftStoreService);
  private readonly draftSync = inject(RockExplorerDraftSyncService);
  private readonly draftReconcile = inject(RockExplorerDraftReconcileService);
  private readonly pendingImages = inject(RockExplorerPendingImageService);
  private readonly rockExplorerService = inject(RockExplorerService);
  private readonly galleryService = inject(GalleryService);
  private readonly uploadService = inject(UploadService);
  private readonly transloco = inject(TranslocoService);
  private readonly liveSessionGuard = inject(RockExplorerLiveSessionGuard);
  private readonly store = inject(Store);
  private readonly capacitorApp = inject(CAPACITOR_APP);

  /** Cap App `appStateChange` handle — removed in {@link destroy} (D-15). */
  private appStateHandle: PluginListenerHandle | null = null;

  /** Lazily loaded only when mock GPS is allowed (web/dev; never on native). */
  private mockGps: RockExplorerMockGpsService | null = null;
  private mockGpsLoad: Promise<RockExplorerMockGpsService | null> | null = null;

  /** Web/dev mock walker only — gated off Capacitor native (D-05). */
  private isMockGpsEnabled(): boolean {
    return mockGpsRecording && !Capacitor.isNativePlatform();
  }

  /** Live-tracking session (survives exit Record until component destroy). */
  private recordingSession: RockExplorerRecordingSession | null = null;
  /** IndexedDB local draft id for the active recording session. */
  private activeLocalId: string | null = null;
  private geoWatchId: number | null = null;
  /** Serializes draft persists so exit/finish always awaits the latest write. */
  private persistChain: Promise<void> = Promise.resolve();
  /** Force another persist after the current chain step (exit during GPS sync). */
  private persistForceQueued = false;
  /** Zoom close on the next kept GPS fix after entering/resuming Record. */
  private zoomCloseOnNextFix = false;
  /** Delay before showing "Syncing…" so fast flushes don't flicker the toolbar. */
  private static readonly SYNCING_UI_DELAY_MS = 1000;
  private syncingUiDelayHandle: ReturnType<typeof setTimeout> | null = null;
  /** While true, ignore draft→UI sync status updates (except the delayed syncing paint). */
  private syncUiHeld = false;
  /** Browser network-interface heuristic (see OfflineAlertComponent). */
  private browserOnline =
    typeof navigator !== 'undefined' ? navigator.onLine : true;
  /** App-level offline banner — failed request evidence, not navigator alone. */
  private appOfflineAlert = false;
  /** Last rendered local-draft polygons (grey, unfinished, no paths). */
  private localDraftFeaturesData: FeatureCollection<Geometry> =
    emptyFeatureCollection();

  private readonly onWindowOnline = (): void => {
    this.browserOnline = true;
    this.refreshOnlineUi();
    void this.flushDraftQueue();
  };
  private readonly onWindowOffline = (): void => {
    this.browserOnline = false;
    this.refreshOnlineUi();
  };
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      this.browserOnline = navigator.onLine;
      this.refreshOnlineUi();
      void this.flushDraftQueue();
    }
  };

  /** 409 device-lock clone dialog. */
  public deviceLockDialogVisible = false;
  private deviceLockLocalId: string | null = null;
  private deviceLockServerId: string | null = null;
  private deviceLockCloneInFlight = false;

  /** Compact publish dialog. */
  public publishDialogVisible = false;
  public publishPotential: string | null = null;
  public publishTitle = '';
  public publishDescription = '';
  public publishInFlight = false;
  private publishLocalId: string | null = null;

  constructor(private readonly host: RockExplorerRecordingFacadeHost) {
    this.draftSync.deviceLockConflict$
      .pipe(takeUntilDestroyed(host.destroyRef))
      .subscribe((event) => {
        host.ngZone.run(() => {
          void this.handleDeviceLockConflict(event);
        });
      });
  }

  /** Grey local-draft polygons (unfinished, no paths) — for host `fitToFeatures`. */
  get localDraftFeatures(): FeatureCollection<Geometry> {
    return this.localDraftFeaturesData;
  }

  // ---------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------

  /** Call once from host `ngAfterViewInit` (map/layers may not exist yet). */
  init(): void {
    this.browserOnline = navigator.onLine;
    this.refreshOnlineUi();
    window.addEventListener('online', this.onWindowOnline);
    window.addEventListener('offline', this.onWindowOffline);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    if (Capacitor.isNativePlatform()) {
      void this.capacitorApp
        .addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            void this.flushDraftQueue();
          }
        })
        .then((handle) => {
          this.appStateHandle = handle;
        });
    }
    this.store
      .select(selectShowOfflineAlert)
      .pipe(takeUntilDestroyed(this.host.destroyRef))
      .subscribe((showOffline) => {
        this.appOfflineAlert = showOffline;
        this.refreshOnlineUi();
      });
    void this.probeDraftStorage();
  }

  /** Call from host `ngOnDestroy`. */
  destroy(): void {
    window.removeEventListener('online', this.onWindowOnline);
    window.removeEventListener('offline', this.onWindowOffline);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    const appStateHandle = this.appStateHandle;
    this.appStateHandle = null;
    if (appStateHandle) {
      void appStateHandle.remove();
    }
    this.releaseSyncUiHold();
    this.stopGeoWatch();
    this.host.ui.nativeGpsTrackingActive.set(false);
    this.liveSessionGuard.setLiveSession(false);
    this.uninstallMockGpsShim();
    uninstallNativeGpsShim();
  }

  // ---------------------------------------------------------------------
  // Toolbar commands (enter/exit/pause/resume/finish/new path/sync)
  // ---------------------------------------------------------------------

  enterRecordMode(): void {
    void this.enterRecordModeAsync({ resume: true });
  }

  pauseRecording(): void {
    if (!this.recordingSession || !this.host.ui.recordModeActive()) {
      return;
    }
    this.recordingSession.pause();
    this.syncRecordUiSignals();
    void this.persistAndSync(true);
    this.host.cdr.detectChanges();
  }

  resumeRecording(): void {
    if (!this.recordingSession || !this.host.ui.recordModeActive()) {
      return;
    }
    if (this.isMockGpsEnabled()) {
      this.seedMockGpsNearActiveSession();
    }
    this.recordingSession.resume();
    this.syncRecordUiSignals();
    this.zoomCloseOnNextFix = true;
    void this.startGeoWatch();
    this.host.cdr.detectChanges();
  }

  finishRecordPath(): void {
    if (!this.recordingSession || !this.host.ui.recordModeActive()) {
      return;
    }
    if (!this.recordingSession.finishPath()) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.recordFinishPathTooShort'),
        ),
      });
      return;
    }
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    void this.persistAndSync(true);
    this.host.cdr.detectChanges();
  }

  newRecordPath(): void {
    if (!this.recordingSession || !this.host.ui.recordModeActive()) {
      return;
    }
    if (this.recordingSession.activePathId != null) {
      return;
    }
    this.recordingSession.newPath();
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    void this.startGeoWatch();
    void this.persistAndSync(true);
    this.host.cdr.detectChanges();
  }

  exitRecordMode(): void {
    void this.exitRecordModeAsync();
  }

  /**
   * Leave Record chrome: stop GPS, close open path if usable, auto-build a
   * convex-hull polygon from overlays, then persist. Paths stay hidden until
   * the draft is selected again; grey local-draft polygons stay on the map.
   */
  async exitRecordModeAsync(): Promise<void> {
    if (!this.host.ui.recordModeActive()) {
      return;
    }
    this.stopGeoWatch();
    if (this.recordingSession?.isRecording) {
      this.recordingSession.pause();
    }
    if (this.recordingSession && this.activeLocalId) {
      await this.applyRecordingPolygon(
        this.recordingSession,
        this.activeLocalId,
      );
    }
    this.host.ui.recordModeActive.set(false);
    this.liveSessionGuard.setLiveSession(false);
    this.syncRecordUiSignals();
    this.host.layers?.setPaths(emptyFeatureCollection());
    this.host.layers?.clearDraft();
    await this.persistAndSync(true);
    await this.refreshLocalDraftPolygons();
    await this.host.images.refreshDraftPins();
    this.host.cdr.detectChanges();
  }

  async onSyncNow(): Promise<void> {
    if (!this.host.ui.storageOk()) {
      return;
    }
    if (this.recordingSession && this.activeLocalId) {
      await this.persistAndSync(true);
      return;
    }
    try {
      await this.runFlushWithDelayedSyncingUi(() =>
        this.draftSync.flush({
          preferLocalId: this.activeLocalId ?? undefined,
        }),
      );
      if (this.activeLocalId) {
        await this.refreshSyncStatusFromDraft(this.activeLocalId);
      } else {
        this.host.ui.syncStatus.set(null);
      }
    } catch {
      this.releaseSyncUiHold();
      this.host.ui.syncStatus.set('error');
    }
    this.host.cdr.detectChanges();
  }

  // ---------------------------------------------------------------------
  // Sessions panel
  // ---------------------------------------------------------------------

  openSessionsPanel(): void {
    if (this.host.ui.panelOpen()) {
      this.host.closePanel();
    }
    this.host.ui.sessionsPanelOpen.set(true);
    this.host.cdr.detectChanges();
  }

  closeSessionsPanel(): void {
    this.host.ui.sessionsPanelOpen.set(false);
  }

  /** Feature panel and sessions panel are mutually exclusive. */
  private closeSessionsPanelIfOpen(): void {
    if (this.host.ui.sessionsPanelOpen()) {
      this.host.ui.sessionsPanelOpen.set(false);
    }
  }

  // ---------------------------------------------------------------------
  // Enter Record / Continue draft
  // ---------------------------------------------------------------------

  /**
   * Enter Record chrome. When resume=false (Continue draft), stay paused and
   * do not start GPS until the user hits Resume.
   */
  private async enterRecordModeAsync(options: {
    resume: boolean;
  }): Promise<void> {
    if (this.host.ui.recordModeActive()) {
      return;
    }
    if (!this.host.ui.storageOk()) {
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.storageUnavailable'),
        ),
      });
      return;
    }
    if (this.host.ui.isDrawToolActive()) {
      this.host.setRockExplorerDrawMode('select');
    }
    if (this.host.ui.drawingPath()) {
      this.host.cancelPathDraw();
    }
    this.host.closePanel();
    this.closeSessionsPanelIfOpen();
    this.host.ui.showFilters.set(false);
    this.host.ui.drawMode.set('select');

    if (!this.recordingSession) {
      const localId = crypto.randomUUID();
      this.activeLocalId = localId;
      this.host.ui.activeLocalDraftId.set(localId);
      this.recordingSession = new RockExplorerRecordingSession(
        getOrCreateRecordingDeviceId(),
      );
      this.host.ui.syncStatus.set('pending');
      // Await reset before watchPosition — a fire-and-forget reset raced the
      // shim seed and could emit the default [0,0] (Gulf of Guinea) first.
      if (this.isMockGpsEnabled()) {
        const mock = await this.ensureMockGps();
        await mock?.resetSeed();
      }
    } else if (options.resume) {
      this.recordingSession.resume();
      if (this.isMockGpsEnabled()) {
        this.seedMockGpsNearActiveSession();
      }
    } else {
      this.recordingSession.pause();
    }

    this.host.ui.recordModeActive.set(true);
    this.host.ui.hasRecordingSession.set(true);
    this.liveSessionGuard.setLiveSession(true, {
      finish: () => this.exitRecordModeAsync(),
      discard: () => this.discardActiveLiveSession(),
    });
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    if (options.resume && this.recordingSession.isRecording) {
      this.zoomCloseOnNextFix = true;
      void this.startGeoWatch();
      try {
        this.host.triggerGeolocate();
      } catch {
        // Geolocate may throw if permissions pending; watch handles denial.
      }
    }
    this.host.cdr.detectChanges();
  }

  async continueDraft(localId: string): Promise<void> {
    if (this.host.ui.recordModeActive()) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.exitRecordBeforeSwitch'),
        ),
      });
      return;
    }
    if (!this.host.ui.storageOk()) {
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.storageUnavailable'),
        ),
      });
      return;
    }

    if (
      this.recordingSession &&
      this.activeLocalId &&
      this.activeLocalId !== localId
    ) {
      await this.persistAndSync(true);
    }

    const draft = await this.draftStore.get(localId);
    if (!draft) {
      return;
    }

    const session = RockExplorerRecordingSession.hydrateFromSnapshot(
      draft.snapshot,
      draft.deviceId || getOrCreateRecordingDeviceId(),
    );
    session.pause();
    if (draft.serverId) {
      session.feature.id = draft.serverId;
    }

    this.recordingSession = session;
    this.activeLocalId = localId;
    this.host.ui.activeLocalDraftId.set(localId);
    this.host.ui.syncStatus.set(draft.syncStatus);
    this.host.ui.hasRecordingSession.set(true);

    if (this.isMockGpsEnabled()) {
      this.seedMockGpsNearDraft(session, draft);
    }

    await this.enterRecordModeAsync({ resume: false });
    if (draft.serverId) {
      this.host.images.loadFeature(draft.serverId);
    }
    await this.host.images.refreshDraftPins();
    this.closeSessionsPanelIfOpen();
    if (session.feature.geometry && this.host.map) {
      fitMapToGeometry(this.host.map, session.feature.geometry, {
        padding: 64,
        maxZoom: 17,
      });
    } else {
      const positions = this.positionsFromDraftSnapshot(draft);
      if (positions.length > 0) {
        this.host.fitMapToPositions(positions);
      }
    }
  }

  // ---------------------------------------------------------------------
  // Mock GPS (dev-only walker; stripped from prod via loader replacement)
  // ---------------------------------------------------------------------

  /** Place mock GPS near the draft polygon centroid (or path centroid). */
  private seedMockGpsNearDraft(
    session: RockExplorerRecordingSession,
    draft: RockExplorerDraftRecord,
  ): void {
    let geometry =
      session.feature.geometry ?? this.geometryFromDraftSnapshot(draft);
    if (!geometry || geometry.type !== 'Polygon') {
      geometry = this.computePolygonFromDraftRecord(draft);
    }
    this.seedMockGpsNearGeometryOrPaths(
      geometry,
      this.positionsFromDraftSnapshot(draft),
    );
  }

  /** Re-seed from the active in-memory session (Resume / re-enter Record). */
  private seedMockGpsNearActiveSession(): void {
    const session = this.recordingSession;
    if (!session) {
      return;
    }
    let geometry = session.feature.geometry;
    const pathPoints: Position[] = [];
    for (const path of session.feature.paths ?? []) {
      for (const coord of path.geometry?.coordinates ?? []) {
        if (coord.length >= 2) {
          pathPoints.push([coord[0], coord[1]]);
        }
      }
    }
    for (const site of session.feature.parkingSites ?? []) {
      if (site.lat != null && site.lng != null) {
        pathPoints.push([site.lng, site.lat]);
      }
    }
    if (!geometry || geometry.type !== 'Polygon') {
      geometry = geometryFromOverlayPoints(pathPoints);
    }
    this.seedMockGpsNearGeometryOrPaths(geometry, pathPoints);
  }

  private seedMockGpsNearGeometryOrPaths(
    geometry: Geometry | null,
    pathPoints: Position[],
  ): void {
    let centroid = geometry ? geometryLabelPoint(geometry) : null;
    if (!centroid && pathPoints.length > 0) {
      let lngSum = 0;
      let latSum = 0;
      for (const p of pathPoints) {
        lngSum += p[0];
        latSum += p[1];
      }
      centroid = [lngSum / pathPoints.length, latSum / pathPoints.length];
    }
    if (centroid) {
      void this.ensureMockGps().then((mock) => {
        mock?.seedNear({ lng: centroid![0], lat: centroid![1] });
      });
    }
  }

  /**
   * Load mock GPS when enabled. Prod replaces the loader with a null stub so
   * the service module is never on the production module graph. Host calls
   * this from `initMap` to install the navigator shim once resolved:
   * `facade.ensureMockGps().then((mock) => mock?.installNavigatorShim(fallback))`.
   */
  ensureMockGps(): Promise<RockExplorerMockGpsService | null> {
    if (!this.isMockGpsEnabled()) {
      return Promise.resolve(null);
    }
    if (this.mockGps) {
      return Promise.resolve(this.mockGps);
    }
    if (!this.mockGpsLoad) {
      this.mockGpsLoad = loadMockGps().then((instance) => {
        this.mockGps = instance;
        return instance;
      });
    }
    return this.mockGpsLoad;
  }

  /** Restore real `navigator.geolocation` (host `ngOnDestroy` — also called by {@link destroy}). */
  uninstallMockGpsShim(): void {
    this.mockGps?.uninstallNavigatorShim();
  }

  // ---------------------------------------------------------------------
  // Publish
  // ---------------------------------------------------------------------

  async beginPublishDraft(localId?: string): Promise<void> {
    const targetLocalId =
      localId ?? this.activeLocalId ?? this.host.ui.activeLocalDraftId();

    // Keep Record chrome when publishing the active draft; only leave Record
    // when publishing a different session from the sessions panel.
    if (this.host.ui.recordModeActive()) {
      if (targetLocalId && targetLocalId === this.activeLocalId) {
        await this.prepareRecordSessionForPublish();
      } else {
        await this.exitRecordModeAsync();
      }
    }

    if (!targetLocalId) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.publishNoDraft'),
        ),
      });
      return;
    }

    if (
      this.recordingSession &&
      this.activeLocalId &&
      this.activeLocalId !== targetLocalId
    ) {
      await this.persistAndSync(true);
    }

    // Ensure draft exists locally; hydrate session if needed for overlay points
    let draft = await this.draftStore.get(targetLocalId);
    if (
      !draft &&
      this.recordingSession &&
      this.activeLocalId === targetLocalId
    ) {
      await this.persistAndSync(true);
      draft = await this.draftStore.get(targetLocalId);
    }
    if (!draft) {
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.publishNoDraft'),
        ),
      });
      return;
    }

    if (!this.host.ui.online()) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.cannotPublishOffline'),
        ),
      });
      return;
    }

    // Flush so we have a serverId before publish
    if (!draft.serverId) {
      try {
        await this.draftSync.flush({ preferLocalId: targetLocalId });
        draft = await this.draftStore.get(targetLocalId);
      } catch {
        // fall through
      }
    }
    if (!draft?.serverId) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.cannotPublishOffline'),
        ),
      });
      return;
    }

    if (!this.recordingSession || this.activeLocalId !== targetLocalId) {
      const session = RockExplorerRecordingSession.hydrateFromSnapshot(
        draft.snapshot,
        draft.deviceId || getOrCreateRecordingDeviceId(),
      );
      session.pause();
      if (draft.serverId) {
        session.feature.id = draft.serverId;
      }
      this.recordingSession = session;
      this.activeLocalId = targetLocalId;
      this.host.ui.activeLocalDraftId.set(targetLocalId);
      this.host.ui.hasRecordingSession.set(true);
      this.syncRecordUiSignals();
    } else {
      // Ensure latest panel edits are in the local draft before prefill.
      await this.persistAndSync(true);
      draft = (await this.draftStore.get(targetLocalId)) ?? draft;
    }

    this.publishLocalId = targetLocalId;
    this.prefillPublishDialogFromDraft(this.recordingSession.feature, draft);
    this.publishDialogVisible = true;
    this.host.cdr.detectChanges();
  }

  /**
   * Pause GPS, finish open path / build hull, persist — but stay in Record chrome
   * so Publish cancel returns to an active draft toolbar.
   */
  private async prepareRecordSessionForPublish(): Promise<void> {
    if (!this.recordingSession || !this.activeLocalId) {
      return;
    }
    this.stopGeoWatch();
    if (this.recordingSession.isRecording) {
      this.recordingSession.pause();
    }
    await this.applyRecordingPolygon(this.recordingSession, this.activeLocalId);
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    await this.persistAndSync(true);
  }

  /** Prefill publish fields from session, falling back to the local draft snapshot. */
  private prefillPublishDialogFromDraft(
    feature: RockExplorerFeature,
    draft: RockExplorerDraftRecord,
  ): void {
    const snap = draft.snapshot.feature;
    const snapTitle =
      typeof snap['title'] === 'string' ? (snap['title'] as string) : null;
    const snapDescription =
      typeof snap['description'] === 'string'
        ? (snap['description'] as string)
        : null;
    const snapPotential =
      typeof snap['potential'] === 'string'
        ? (snap['potential'] as string)
        : null;

    this.publishTitle = feature.title ?? snapTitle ?? '';
    this.publishDescription = feature.description ?? snapDescription ?? '';
    this.publishPotential = feature.potential ?? snapPotential ?? null;
  }

  cancelPublishDialog(): void {
    if (this.publishInFlight) {
      return;
    }
    this.publishDialogVisible = false;
    this.publishLocalId = null;
    this.host.cdr.detectChanges();
  }

  async confirmPublishDialog(): Promise<void> {
    if (this.publishInFlight || !this.publishLocalId) {
      return;
    }
    if (!this.publishPotential) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.publishPotentialRequired'),
        ),
      });
      return;
    }

    const localId = this.publishLocalId;
    const draft = await this.draftStore.get(localId);
    if (!draft?.serverId) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.cannotPublishOffline'),
        ),
      });
      return;
    }

    const session =
      this.recordingSession && this.activeLocalId === localId
        ? this.recordingSession
        : RockExplorerRecordingSession.hydrateFromSnapshot(
            draft.snapshot,
            draft.deviceId || getOrCreateRecordingDeviceId(),
          );
    session.feature.id = draft.serverId;
    session.feature.potential = this.publishPotential as RockExplorerPotential;
    session.feature.title = this.publishTitle.trim() || null;
    session.feature.description = this.publishDescription.trim() || null;

    const overlayPoints = await this.collectPublishOverlayPoints(
      session,
      localId,
    );
    const geometry = geometryForPublishFromOverlays(overlayPoints);
    if (!geometry) {
      this.host.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.publishNoGeometry'),
        ),
      });
      return;
    }

    this.publishInFlight = true;
    try {
      const deviceId = (
        draft.deviceId ||
        session.feature.recordingDeviceId ||
        getOrCreateRecordingDeviceId()
      ).trim();
      if (!deviceId) {
        this.host.messageService.add({
          severity: 'error',
          summary: this.transloco.translate(marker('rockExplorer.loadError')),
        });
        return;
      }

      session.feature.geometry = geometry;
      session.feature.status = 'published';
      session.feature.recordingDeviceId = null;
      // Paths for HTTP: finished lines only
      session.feature.paths = session.pathsForSerialize();

      const published = await firstValueFrom(
        this.rockExplorerService.publishFeature(session.feature, deviceId),
      );

      try {
        await this.pendingImages.drainForLocalId(localId, published.id);
      } catch {
        // best-effort
      }

      await this.draftStore.deleteLocal(localId);

      if (this.activeLocalId === localId) {
        this.stopGeoWatch();
        this.host.ui.recordModeActive.set(false);
        this.liveSessionGuard.setLiveSession(false);
        this.recordingSession = null;
        this.activeLocalId = null;
        this.host.ui.activeLocalDraftId.set(null);
        this.host.ui.syncStatus.set(null);
        this.host.ui.hasRecordingSession.set(false);
        this.syncRecordUiSignals();
        this.host.layers?.setPaths(emptyFeatureCollection());
      }

      this.publishDialogVisible = false;
      this.publishLocalId = null;
      this.host.reloadFeatures();
      await this.refreshLocalDraftPolygons();
      this.host.images.clearLivePins();
      await this.host.images.refreshDraftPins();
      this.host.applyFeatureToPanel(published, false);
      this.host.messageService.add({
        severity: 'success',
        summary: this.transloco.translate(
          marker('rockExplorer.publishSuccess'),
        ),
      });
    } catch (err) {
      const locked = err instanceof HttpErrorResponse && err.status === 409;
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          locked
            ? marker('rockExplorer.deviceLockTitle')
            : marker('rockExplorer.loadError'),
        ),
      });
    } finally {
      this.publishInFlight = false;
      this.host.cdr.detectChanges();
    }
  }

  private async collectPublishOverlayPoints(
    session: RockExplorerRecordingSession,
    localId: string,
    options?: { includeMapImagePins?: boolean },
  ): Promise<Position[]> {
    const points: Position[] = [];
    for (const site of session.feature.parkingSites ?? []) {
      if (site.lat != null && site.lng != null) {
        points.push([site.lng, site.lat]);
      }
    }
    for (const path of session.feature.paths ?? []) {
      for (const coord of path.geometry?.coordinates ?? []) {
        if (coord.length >= 2) {
          points.push([coord[0], coord[1]]);
        }
      }
    }
    if (options?.includeMapImagePins !== false) {
      // Uploaded image pins currently on map for this feature (if any)
      for (const feature of this.host.images.data.features) {
        if (feature.geometry?.type === 'Point') {
          points.push([
            feature.geometry.coordinates[0],
            feature.geometry.coordinates[1],
          ]);
        }
      }
    }
    const pendingPins = await this.pendingImages.listGpsPins(localId);
    for (const pin of pendingPins) {
      points.push([pin.lng, pin.lat]);
    }
    return points;
  }

  /**
   * Finish an open GPS path (≥2 verts) and set feature.geometry to a convex
   * hull polygon around paths / parking / image pins when possible.
   */
  private async applyRecordingPolygon(
    session: RockExplorerRecordingSession,
    localId: string,
    options?: { includeMapImagePins?: boolean },
  ): Promise<void> {
    const open = session.activePath;
    if (open && (open.geometry?.coordinates.length ?? 0) >= 2) {
      session.finishPath();
    }
    const points = await this.collectPublishOverlayPoints(
      session,
      localId,
      options,
    );
    const geometry = geometryFromOverlayPoints(points);
    if (geometry) {
      session.feature.geometry = geometry;
    }
  }

  // ---------------------------------------------------------------------
  // Panel save hook (host `onPanelSaveFeature` keeps the session in sync)
  // ---------------------------------------------------------------------

  /** Copy editable metadata onto the active recording session when IDs match. */
  syncRecordingSessionFromEditedFeature(feature: RockExplorerFeature): void {
    const session = this.recordingSession;
    if (!session || !this.activeLocalId) {
      return;
    }
    if (feature.id && session.feature.id && feature.id !== session.feature.id) {
      return;
    }
    session.feature.title = feature.title;
    session.feature.description = feature.description;
    session.feature.potential = feature.potential;
    session.feature.rockQuality = feature.rockQuality;
    session.feature.rockType = feature.rockType;
    session.feature.gradeLineType = feature.gradeLineType;
    session.feature.gradeScale = feature.gradeScale;
    session.feature.gradeValueMin = feature.gradeValueMin;
    session.feature.gradeValueMax = feature.gradeValueMax;
    session.feature.accessIssues = [...(feature.accessIssues ?? [])];
    if (feature.id) {
      session.feature.id = feature.id;
    }
  }

  // ---------------------------------------------------------------------
  // Record photo capture
  // ---------------------------------------------------------------------

  triggerAddRecordImage(): void {
    if (!this.host.ui.recordModeActive() && !this.activeLocalId) {
      return;
    }
    this.host.getRecordImageInputElement()?.click();
  }

  onRecordImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    void this.addRecordImageFile(file);
  }

  private async addRecordImageFile(file: File): Promise<void> {
    const localId = this.activeLocalId ?? this.host.ui.activeLocalDraftId();
    if (!localId) {
      return;
    }
    if (!this.isMockGpsEnabled() && !navigator.geolocation) {
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.recordGeoDenied'),
        ),
      });
      return;
    }

    let lat: number;
    let lng: number;
    try {
      const pos = await this.getRecordingPosition();
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.recordGeoDenied'),
        ),
      });
      return;
    }

    const draft = await this.draftStore.get(localId);
    const serverId =
      draft?.serverId ?? this.recordingSession?.feature.id ?? null;

    if (serverId && this.draftSync.isOnline()) {
      try {
        await this.uploadRecordImageNow(serverId, file, lat, lng);
        this.host.images.appendLivePin(lat, lng);
        this.host.messageService.add({
          severity: 'success',
          summary: this.transloco.translate(
            marker('rockExplorer.imageUploadSuccess'),
          ),
        });
      } catch {
        // Fall back to queue
        await this.pendingImages.enqueue(localId, file, lat, lng, file.name);
        await this.host.images.refreshDraftPins();
        this.host.messageService.add({
          severity: 'info',
          summary: this.transloco.translate(
            marker('rockExplorer.imageQueuedOffline'),
          ),
        });
      }
    } else {
      await this.pendingImages.enqueue(localId, file, lat, lng, file.name);
      await this.host.images.refreshDraftPins();
      this.host.messageService.add({
        severity: 'info',
        summary: this.transloco.translate(
          marker('rockExplorer.imageQueuedOffline'),
        ),
      });
    }
    this.host.cdr.detectChanges();
  }

  private async uploadRecordImageNow(
    serverFeatureId: string,
    file: File,
    lat: number,
    lng: number,
  ): Promise<void> {
    const uploaded = await firstValueFrom(this.uploadService.uploadFile(file));
    const feature = new RockExplorerFeature();
    feature.id = serverFeatureId;
    const galleryImage = new GalleryImage();
    galleryImage.image = uploaded;
    galleryImage.description = null;
    const tag = new Tag();
    tag.object = feature;
    tag.objectType = ObjectType.RockExplorerFeature;
    galleryImage.tags = [tag];
    const created = await firstValueFrom(
      this.galleryService.createGalleryImage(galleryImage),
    );
    created.lat = lat;
    created.lng = lng;
    await firstValueFrom(this.galleryService.updateGalleryImage(created));
  }

  async editRecordInfo(): Promise<void> {
    const localId = this.activeLocalId ?? this.host.ui.activeLocalDraftId();
    if (!localId || !this.recordingSession) {
      return;
    }
    await this.persistAndSync(true);
    const draft = await this.draftStore.get(localId);
    const feature = this.recordingSession.feature;
    if (draft?.serverId) {
      feature.id = draft.serverId;
    }
    // Open the feature form so title / potential / description can be edited
    // and later prefilled into Publish.
    this.host.applyFeatureToPanel(feature, true);
    this.host.cdr.detectChanges();
  }

  // ---------------------------------------------------------------------
  // Delete draft
  // ---------------------------------------------------------------------

  confirmDeleteDraft(localId: string, event?: Event): void {
    const target = event?.currentTarget ?? event?.target ?? undefined;
    this.host.confirmationService.confirm({
      target: target as EventTarget | undefined,
      message: this.transloco.translate(
        marker('rockExplorer.deleteDraftConfirm'),
      ),
      acceptLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteYes'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteNo'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        void this.deleteDraft(localId);
      },
    });
  }

  /**
   * Discard the active live draft without a nested confirm (D-04).
   * Used by RockExplorerLiveSessionGuard after the user picks Discard.
   */
  async discardActiveLiveSession(): Promise<void> {
    if (this.activeLocalId) {
      await this.deleteDraft(this.activeLocalId);
      return;
    }
    this.stopGeoWatch();
    this.host.ui.recordModeActive.set(false);
    this.host.ui.hasRecordingSession.set(false);
    this.syncRecordUiSignals();
    this.liveSessionGuard.setLiveSession(false);
    this.host.cdr.detectChanges();
  }

  private async deleteDraft(localId: string): Promise<void> {
    const draft = await this.draftStore.get(localId);
    const wasActive = this.activeLocalId === localId;

    await this.draftStore.deleteLocal(localId);

    if (wasActive) {
      if (this.host.ui.recordModeActive()) {
        this.stopGeoWatch();
        this.host.ui.recordModeActive.set(false);
      }
      this.recordingSession = null;
      this.activeLocalId = null;
      this.host.ui.activeLocalDraftId.set(null);
      this.host.ui.syncStatus.set(null);
      this.host.ui.hasRecordingSession.set(false);
      this.syncRecordUiSignals();
      this.host.layers?.setPaths(emptyFeatureCollection());
      this.liveSessionGuard.setLiveSession(false);
    }

    if (draft?.serverId && this.draftSync.isOnline()) {
      const feature = new RockExplorerFeature();
      feature.id = draft.serverId;
      feature.status = 'draft';
      feature.recordingDeviceId =
        draft.deviceId || getOrCreateRecordingDeviceId();
      try {
        await firstValueFrom(this.rockExplorerService.deleteFeature(feature));
      } catch (err) {
        const locked = err instanceof HttpErrorResponse && err.status === 409;
        this.host.messageService.add({
          severity: locked ? 'warn' : 'warn',
          summary: this.transloco.translate(
            marker('rockExplorer.deleteServerRemains'),
          ),
        });
      }
    }

    await this.refreshLocalDraftPolygons();
    await this.host.images.refreshDraftPins();
    this.host.cdr.detectChanges();
  }

  // ---------------------------------------------------------------------
  // Local-draft polygons (grey, unfinished) + Sessions "show on map"
  // ---------------------------------------------------------------------

  async showDraftOnMap(localId: string): Promise<void> {
    const draft = await this.draftStore.get(localId);
    if (!draft) {
      return;
    }
    await this.refreshLocalDraftPolygons();
    let geometry = this.geometryFromDraftSnapshot(draft);
    if (!geometry) {
      const session = RockExplorerRecordingSession.hydrateFromSnapshot(
        draft.snapshot,
        draft.deviceId || getOrCreateRecordingDeviceId(),
      );
      await this.applyRecordingPolygon(session, localId, {
        includeMapImagePins: false,
      });
      geometry = session.feature.geometry;
      if (geometry) {
        // Persist full session (finished paths + hull), not geometry alone.
        await this.draftStore.putSnapshot(localId, session, {
          deviceId: draft.deviceId || undefined,
          serverId: draft.serverId,
          syncStatus: draft.syncStatus,
          title: draft.title,
          recordingState: session.recordingState,
        });
        await this.refreshLocalDraftPolygons();
      }
    }
    this.host.layers?.setPaths(emptyFeatureCollection());
    this.host.layers?.clearDraft();
    if (geometry && this.host.map) {
      fitMapToGeometry(this.host.map, geometry, {
        padding: 64,
        maxZoom: 17,
      });
    } else {
      const positions = this.positionsFromDraftSnapshot(draft);
      if (positions.length > 0) {
        this.host.fitMapToPositions(positions);
      }
    }
    this.closeSessionsPanelIfOpen();
    this.host.cdr.detectChanges();
  }

  /**
   * Render all local unfinished drafts as grey polygons (no paths). Called by
   * the host after language changes re-render map labels/layers too.
   */
  async refreshLocalDraftPolygons(): Promise<void> {
    if (!this.host.layers) {
      return;
    }
    let drafts: RockExplorerDraftRecord[] = [];
    try {
      drafts = await this.draftStore.listByUpdatedAtDesc();
    } catch {
      this.localDraftFeaturesData = emptyFeatureCollection();
      this.host.layers.clearLocalDrafts();
      return;
    }
    const features: Feature[] = [];
    for (const draft of drafts) {
      let geometry = this.geometryFromDraftSnapshot(draft);
      if (!geometry) {
        geometry = this.computePolygonFromDraftRecord(draft);
        if (geometry) {
          // Re-read before write so a concurrent putSnapshot cannot be
          // overwritten with a stale list snapshot (paths would be lost).
          try {
            const latest = await this.draftStore.get(draft.localId);
            if (latest && !this.geometryFromDraftSnapshot(latest)) {
              latest.snapshot.feature['geometry'] = structuredClone(geometry);
              await this.draftStore.patch(draft.localId, {
                snapshot: latest.snapshot,
              });
              draft.snapshot = latest.snapshot;
            } else if (latest) {
              geometry = this.geometryFromDraftSnapshot(latest);
              draft.snapshot = latest.snapshot;
            }
          } catch {
            // Display still works even if persist fails.
          }
        }
      }
      if (!geometry || geometry.type !== 'Polygon') {
        continue;
      }
      features.push({
        type: 'Feature',
        geometry,
        properties: {
          localId: draft.localId,
          title: draft.title,
          serverId: draft.serverId,
        },
      });
    }
    this.localDraftFeaturesData = { type: 'FeatureCollection', features };
    this.host.layers.setLocalDrafts(this.localDraftFeaturesData);
  }

  /** Build a convex hull from a draft's paths/parking when geometry is missing. */
  private computePolygonFromDraftRecord(
    draft: RockExplorerDraftRecord,
  ): Geometry | null {
    try {
      const session = RockExplorerRecordingSession.hydrateFromSnapshot(
        draft.snapshot,
        draft.deviceId || getOrCreateRecordingDeviceId(),
      );
      const points: Position[] = [];
      for (const path of session.feature.paths ?? []) {
        for (const coord of path.geometry?.coordinates ?? []) {
          if (coord.length >= 2) {
            points.push([coord[0], coord[1]]);
          }
        }
      }
      for (const site of session.feature.parkingSites ?? []) {
        if (site.lat != null && site.lng != null) {
          points.push([site.lng, site.lat]);
        }
      }
      return geometryFromOverlayPoints(points);
    } catch {
      return geometryFromOverlayPoints(this.positionsFromDraftSnapshot(draft));
    }
  }

  private geometryFromDraftSnapshot(
    draft: RockExplorerDraftRecord,
  ): Geometry | null {
    const raw = draft.snapshot.feature['geometry'];
    if (!raw || typeof raw !== 'object') {
      return null;
    }
    const geom = raw as Geometry;
    if (geom.type === 'Polygon' && Array.isArray(geom.coordinates)) {
      return structuredClone(geom);
    }
    return null;
  }

  private positionsFromDraftSnapshot(
    draft: RockExplorerDraftRecord,
  ): Position[] {
    const points: Position[] = [];
    const paths = draft.snapshot.feature['paths'];
    if (Array.isArray(paths)) {
      for (const path of paths) {
        const coords = (path as { geometry?: { coordinates?: Position[] } })
          ?.geometry?.coordinates;
        if (!Array.isArray(coords)) {
          continue;
        }
        for (const coord of coords) {
          if (Array.isArray(coord) && coord.length >= 2) {
            points.push([coord[0], coord[1]]);
          }
        }
      }
    }
    const parkings = draft.snapshot.feature['parkingSites'];
    if (Array.isArray(parkings)) {
      for (const site of parkings) {
        const s = site as { lat?: number; lng?: number };
        if (s.lat != null && s.lng != null) {
          points.push([s.lng, s.lat]);
        }
      }
    }
    return points;
  }

  // ---------------------------------------------------------------------
  // GPS watch + live recording signals
  // ---------------------------------------------------------------------

  private syncRecordUiSignals(): void {
    const session = this.recordingSession;
    this.host.ui.hasRecordingSession.set(session != null);
    this.host.ui.recordingState.set(session?.recordingState ?? null);
    this.host.ui.recordPathVertexCount.set(
      session?.activePath?.geometry.coordinates.length ?? 0,
    );
    this.host.ui.hasActiveRecordPath.set(session?.activePathId != null);
    this.host.ui.activeLocalDraftId.set(this.activeLocalId);
  }

  /**
   * Start the geo watch for Record. On native, run staged GPS-04 permissions
   * (FG → disclosure → BG → POST_NOTIFICATIONS) before watch/FGS start (D-08).
   * Call sites may fire-and-forget with `void this.startGeoWatch()`.
   */
  private async startGeoWatch(): Promise<void> {
    if (this.geoWatchId != null) {
      return;
    }
    if (!navigator.geolocation) {
      this.onGeoPermissionDenied();
      return;
    }
    if (Capacitor.isNativePlatform()) {
      try {
        const ok = await ensureRockExplorerTrackingPermissions({
          bridge: GpsBridge,
          showBackgroundDisclosure: () =>
            this.showBackgroundLocationDisclosure(),
          needsPostNotifications: () => Capacitor.getPlatform() === 'android',
        });
        if (!ok) {
          this.onGeoPermissionDenied();
          return;
        }
        // Pitfall 2: user backgrounded mid-staging — do not start FGS silently.
        if (document.visibilityState === 'hidden') {
          this.onGeoPermissionDenied();
          return;
        }
      } catch {
        this.onGeoPermissionDenied();
        return;
      }
      // Bail if a concurrent call already started the watch while we awaited.
      if (this.geoWatchId != null) {
        return;
      }
    }
    if (this.isMockGpsEnabled() && !this.mockGps?.isSeeded) {
      this.host.messageService.add({
        severity: 'info',
        summary: 'Mock GPS',
        detail:
          'Locate + Record use a simulated walker ~5 m/s (mockGpsRecording)',
        life: 4000,
      });
    }
    this.geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.host.ngZone.run(() => this.onRecordingGeoPosition(pos));
      },
      () => {
        this.host.ngZone.run(() => this.onGeoPermissionDenied());
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    if (Capacitor.isNativePlatform()) {
      this.host.ui.nativeGpsTrackingActive.set(true);
    }
  }

  /**
   * Play-prominent ConfirmDialog before ACCESS_BACKGROUND_LOCATION (D-04).
   * Resolves true on accept, false on reject / dismiss.
   */
  private showBackgroundLocationDisclosure(): Promise<boolean> {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (value: boolean) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      };
      this.host.confirmationService.confirm({
        message: this.transloco.translate(
          marker('rockExplorer.gpsBackgroundDisclosureMessage'),
        ),
        header: this.transloco.translate(
          marker('rockExplorer.gpsBackgroundDisclosureHeader'),
        ),
        acceptLabel: this.transloco.translate(
          marker('rockExplorer.gpsBackgroundDisclosureAccept'),
        ),
        rejectLabel: this.transloco.translate(
          marker('rockExplorer.gpsBackgroundDisclosureReject'),
        ),
        icon: 'pi pi-map-marker',
        rejectButtonStyleClass: 'p-button-secondary',
        accept: () => settle(true),
        reject: () => settle(false),
      });
    });
  }

  private stopGeoWatch(): void {
    if (this.geoWatchId == null) {
      return;
    }
    navigator.geolocation.clearWatch(this.geoWatchId);
    this.geoWatchId = null;
    this.host.ui.nativeGpsTrackingActive.set(false);
  }

  /** One-shot fix for geotagged images (mocked via navigator shim when enabled). */
  private getRecordingPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      });
    });
  }

  private onGeoPermissionDenied(): void {
    this.host.messageService.add({
      severity: 'error',
      summary: this.transloco.translate(marker('rockExplorer.recordGeoDenied')),
    });
    this.exitRecordMode();
  }

  private onRecordingGeoPosition(pos: GeolocationPosition): void {
    if (!this.recordingSession || !this.host.ui.recordModeActive()) {
      return;
    }
    if (!this.recordingSession.isRecording) {
      return;
    }
    const kept = this.recordingSession.tryAppendFix({
      lng: pos.coords.longitude,
      lat: pos.coords.latitude,
    });
    if (!kept) {
      return;
    }
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    if (this.host.map) {
      const center: [number, number] = [
        pos.coords.longitude,
        pos.coords.latitude,
      ];
      if (this.zoomCloseOnNextFix) {
        this.zoomCloseOnNextFix = false;
        this.host.map.easeTo({
          center,
          zoom: 30,
          duration: 600,
        });
      } else {
        this.host.map.easeTo({ center, duration: 300 });
      }
    }
    if (this.recordingSession.shouldSyncNow()) {
      void this.persistAndSync(false);
    }
    this.host.cdr.detectChanges();
  }

  private refreshRecordingPathsOnMap(): void {
    if (!this.host.layers || !this.recordingSession) {
      return;
    }
    // Prefer recording paths while Record mode is active (don't fight misc overlays).
    if (this.host.ui.editingFeature() && !this.host.ui.recordModeActive()) {
      return;
    }
    this.host.layers.ensureMiscOverlayLayers();
    this.host.layers.setPaths({
      type: 'FeatureCollection',
      features: this.recordingSession.feature.paths
        .filter((path) => (path.geometry?.coordinates?.length ?? 0) >= 2)
        .map((path) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'LineString' as const,
            // MapLibre paints with lng/lat only; strip rich extras for display.
            coordinates: path.geometry.coordinates.map(
              (c) => [c[0], c[1]] as [number, number],
            ),
          },
          properties: {
            id: path.id,
            title: path.title,
            description: path.description,
            source: path.source ?? 'gps',
          },
        })),
    });
  }

  // ---------------------------------------------------------------------
  // Online / offline chrome + draft sync + reconcile
  // ---------------------------------------------------------------------

  /**
   * Publish/sync chrome: require both browser connectivity and no app-level
   * offline banner (banner is driven by failed requests, not navigator alone).
   */
  private refreshOnlineUi(): void {
    this.host.ui.online.set(this.browserOnline && !this.appOfflineAlert);
    this.host.cdr.detectChanges();
  }

  async probeDraftStorage(): Promise<void> {
    const ok = await this.draftStore.probeOpen();
    this.host.ui.storageOk.set(ok);
    if (ok) {
      if (this.host.layers) {
        await this.refreshLocalDraftPolygons();
      }
      // Push local outbox, then pull owner drafts so Sessions works cross-device.
      void this.flushDraftQueue();
    }
    if (!ok) {
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.storageUnavailable'),
        ),
      });
      this.host.cdr.detectChanges();
    }
  }

  async flushDraftQueue(): Promise<void> {
    const preferLocalId = this.activeLocalId ?? undefined;
    try {
      if (this.recordingSession && this.activeLocalId) {
        await this.persistAndSync(true);
        await this.reconcileRemoteDrafts();
        return;
      }
      await this.runFlushWithDelayedSyncingUi(() =>
        this.draftSync.flush({ preferLocalId }),
      );
      if (this.activeLocalId) {
        await this.refreshSyncStatusFromDraft(this.activeLocalId);
      } else {
        this.host.ui.syncStatus.set(null);
      }
      await this.reconcileRemoteDrafts();
    } catch {
      this.releaseSyncUiHold();
      this.host.ui.syncStatus.set('error');
    }
    this.host.cdr.detectChanges();
  }

  /**
   * Merge server owner drafts into IndexedDB (newer wins; never clobber pending).
   */
  private async reconcileRemoteDrafts(): Promise<void> {
    if (!this.host.ui.storageOk() || !this.draftSync.isOnline()) {
      return;
    }
    try {
      await this.draftReconcile.pullAndMerge({
        activeLocalId: this.activeLocalId,
      });
      await this.refreshLocalDraftPolygons();
      await this.host.images.refreshDraftPins();
    } catch {
      // Soft-fail: Sessions still shows local drafts.
    }
  }

  /**
   * Persist session to IndexedDB, enqueue upsert, flush when online (or force).
   * Never skips IDB write when offline — only skips HTTP flush.
   * Writes are serialized; force persists always run after any in-flight write
   * so exit/finish cannot lose finished paths behind a stale mid-recording snapshot.
   * Callers that await a force persist wait until that write completes. Public
   * because the host's `onPanelSaveFeature` triggers a force persist after
   * saving a feature tied to the active recording session.
   */
  persistAndSync(force: boolean): Promise<void> {
    if (force) {
      this.persistForceQueued = true;
    } else if (!this.recordingSession?.shouldSyncNow()) {
      return Promise.resolve();
    }

    const run = async (): Promise<void> => {
      const useForce = this.persistForceQueued;
      this.persistForceQueued = false;

      const session = this.recordingSession;
      const localId = this.activeLocalId;
      if (!session || !localId) {
        return;
      }
      if (!useForce && !session.shouldSyncNow()) {
        return;
      }

      try {
        await this.draftStore.putSnapshot(localId, session);
        await this.draftSync.enqueueUpsert(localId);

        if (this.draftSync.isOnline()) {
          // Hold toolbar appearance for the whole in-flight request; only
          // paint "Syncing…" if it lasts >1s, then apply the final status.
          await this.runFlushWithDelayedSyncingUi(() =>
            this.draftSync.flush({ preferLocalId: localId }),
          );
          await this.refreshSyncStatusFromDraft(localId);
          const draft = await this.draftStore.get(localId);
          if (draft?.serverId) {
            session.feature.id = draft.serverId;
          }
          if (draft?.syncStatus === 'synced') {
            session.markSynced();
          }
        } else {
          await this.refreshSyncStatusFromDraft(localId);
        }
      } catch {
        this.releaseSyncUiHold();
        this.host.ui.syncStatus.set('error');
        if (localId) {
          await this.draftStore.patch(localId, { syncStatus: 'error' });
        }
      } finally {
        this.host.cdr.detectChanges();
      }

      // Another force arrived while we were writing — run again before waiters resume.
      if (this.persistForceQueued) {
        await run();
      }
    };

    const next = this.persistChain.then(run, run);
    this.persistChain = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }

  /**
   * Hold sync-button appearance while a flush is in flight. Fast requests keep
   * the previous label; only flushes lasting more than 1s paint "Syncing…".
   * Callers must refresh the final status after this returns.
   */
  private async runFlushWithDelayedSyncingUi(
    flush: () => Promise<void>,
  ): Promise<void> {
    this.syncUiHeld = true;
    this.beginDelayedSyncingUi();
    try {
      await flush();
    } finally {
      this.releaseSyncUiHold();
    }
  }

  private beginDelayedSyncingUi(): void {
    this.clearSyncingUiDelay();
    this.syncingUiDelayHandle = setTimeout(() => {
      this.syncingUiDelayHandle = null;
      if (!this.syncUiHeld) {
        return;
      }
      this.host.ui.syncStatus.set('syncing');
      this.host.cdr.detectChanges();
    }, RockExplorerRecordingFacade.SYNCING_UI_DELAY_MS);
  }

  private clearSyncingUiDelay(): void {
    if (this.syncingUiDelayHandle != null) {
      clearTimeout(this.syncingUiDelayHandle);
      this.syncingUiDelayHandle = null;
    }
  }

  private releaseSyncUiHold(): void {
    this.clearSyncingUiDelay();
    this.syncUiHeld = false;
  }

  private async refreshSyncStatusFromDraft(localId: string): Promise<void> {
    if (this.syncUiHeld) {
      return;
    }
    const draft = await this.draftStore.get(localId);
    const status = draft?.syncStatus ?? null;
    // IDB may briefly be 'syncing'; only the delayed timer shows that in UI.
    if (status === 'syncing') {
      return;
    }
    this.host.ui.syncStatus.set(status);
  }

  // ---------------------------------------------------------------------
  // Device-lock (HTTP 409) conflict + clone
  // ---------------------------------------------------------------------

  private async handleDeviceLockConflict(
    event: DeviceLockConflictEvent,
  ): Promise<void> {
    if (this.recordingSession) {
      this.recordingSession.pause();
      this.stopGeoWatch();
    }
    if (event.localId) {
      await this.draftStore.patch(event.localId, {
        recordingState: 'paused',
        syncStatus: 'error',
      });
    }
    this.host.ui.syncStatus.set('error');
    this.syncRecordUiSignals();
    this.deviceLockLocalId = event.localId;
    this.deviceLockServerId = event.serverId;
    this.deviceLockDialogVisible = true;
    this.host.cdr.detectChanges();
  }

  cancelDeviceLockDialog(): void {
    this.deviceLockDialogVisible = false;
    this.deviceLockLocalId = null;
    this.deviceLockServerId = null;
    this.host.cdr.detectChanges();
  }

  async confirmDeviceLockClone(): Promise<void> {
    if (this.deviceLockCloneInFlight || !this.deviceLockServerId) {
      return;
    }
    this.deviceLockCloneInFlight = true;
    const oldLocalId = this.deviceLockLocalId;
    const serverId = this.deviceLockServerId;
    const deviceId = getOrCreateRecordingDeviceId();
    try {
      const cloned = await firstValueFrom(
        this.rockExplorerService.cloneFeature(serverId, deviceId),
      );
      const newLocalId = crypto.randomUUID();
      const temp = new RockExplorerRecordingSession(deviceId);
      temp.feature = cloned;
      temp.feature.recordingDeviceId = deviceId;
      temp.activePathId = null;
      temp.pause();
      const session = RockExplorerRecordingSession.hydrateFromSnapshot(
        temp.toSnapshot(),
        deviceId,
      );
      session.pause();

      if (oldLocalId) {
        await this.draftStore.deleteLocal(oldLocalId);
      }
      await this.draftStore.putSnapshot(newLocalId, session, {
        serverId: cloned.id,
        deviceId,
        syncStatus: 'synced',
        recordingState: 'paused',
      });

      this.activeLocalId = newLocalId;
      this.recordingSession = session;
      this.host.ui.activeLocalDraftId.set(newLocalId);
      this.host.ui.syncStatus.set('synced');
      this.host.ui.hasRecordingSession.set(true);
      this.syncRecordUiSignals();
      this.refreshRecordingPathsOnMap();
      this.deviceLockDialogVisible = false;
      this.deviceLockLocalId = null;
      this.deviceLockServerId = null;
    } catch {
      this.host.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(marker('rockExplorer.loadError')),
      });
      this.host.ui.syncStatus.set('error');
    } finally {
      this.deviceLockCloneInFlight = false;
      this.host.cdr.detectChanges();
    }
  }
}
