import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import {
  GeolocateControl,
  GeoJSONSource,
  Map as MaplibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
  NavigationControl,
} from 'maplibre-gl';
import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { HttpErrorResponse } from '@angular/common/http';
import { Toast } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmPopup } from 'primeng/confirmpopup';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { forkJoin, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { MapStyles } from '../../../enums/map-styles';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { GalleryService } from '../../../services/crud/gallery.service';
import { UploadService } from '../../../services/crud/upload.service';
import { ClipboardService } from '../../../services/core/clipboard.service';
import { GalleryImage } from '../../../models/gallery-image';
import { Tag } from '../../../models/tag';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { ObjectType } from '../../../models/object';
import { Coordinates } from '../../../interfaces/coordinates.interface';
import { RockExplorerPotential } from '../../../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../../../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../../../enums/rock-explorer-rock-type';
import { RockExplorerPanelComponent } from '../rock-explorer-panel/rock-explorer-panel.component';
import { RockExplorerToolbarComponent } from '../rock-explorer-toolbar/rock-explorer-toolbar.component';
import { RockExplorerSessionsComponent } from '../rock-explorer-sessions/rock-explorer-sessions.component';
import {
  RockExplorerUiService,
  RockExplorerCommand,
  RockExplorerDrawMode,
  RockExplorerFilters,
} from '../rock-explorer-ui.service';
import {
  RockExplorerRecordingSession,
  getOrCreateRecordingDeviceId,
} from '../rock-explorer-recording';
import { RockExplorerDraftStoreService } from '../offline/rock-explorer-draft-store.service';
import {
  DeviceLockConflictEvent,
  RockExplorerDraftSyncService,
} from '../offline/rock-explorer-draft-sync.service';
import { RockExplorerPendingImageService } from '../offline/rock-explorer-pending-image.service';
import {
  geometryFromOverlayPoints,
  geometryForPublishFromOverlays,
} from '../../../utility/geo/convex-hull';
import { startDocumentDrag } from '../../../utility/map/document-drag';
import { emptyFeatureCollection } from '../../../utility/map/geojson-source';
import {
  fitMapToFeatureCollection,
  fitMapToGeometry,
  fitMapToPositions as fitMapPositions,
} from '../../../utility/map/map-bounds';
import { maptilerStyleUrl } from '../../../utility/map/maptiler-style';
import { RockExplorerImageHoverPopup } from '../map/image-hover-popup';
import {
  buildDraftGeometryPreview,
  buildPolygonDraftCollection,
  closedPolygonRing,
  polygonRingSelfIntersects,
} from '../map/polygon-draft';
import { RockExplorerMapLayers } from '../map/rock-explorer-map-layers';
import {
  ROCK_EXPLORER_LAYERS,
  ROCK_EXPLORER_SOURCES,
} from '../map/rock-explorer-map.constants';

/** When set with point/polygon draw mode, finishing saves onto this feature instead of creating. */
type GeometryRedrawMode = 'point' | 'polygon' | null;

@Component({
  selector: 'lc-rock-explorer',
  imports: [
    FormsModule,
    Toast,
    ConfirmPopup,
    Dialog,
    Button,
    Select,
    InputText,
    Textarea,
    TranslocoDirective,
    RockExplorerPanelComponent,
    RockExplorerToolbarComponent,
    RockExplorerSessionsComponent,
  ],
  providers: [MessageService, ConfirmationService, RockExplorerUiService],
  templateUrl: './rock-explorer.component.html',
  styleUrl: './rock-explorer.component.scss',
})
export class RockExplorerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') private mapContainer?: ElementRef<HTMLElement>;
  @ViewChild(RockExplorerPanelComponent) panel?: RockExplorerPanelComponent;

  readonly ui = inject(RockExplorerUiService);
  private lastFilters: RockExplorerFilters = {};

  public miscEditMode = false;
  /**
   * True for the rest of a map click after an image GPS pick is handled.
   * Prevents a second layer handler (point + polygon under the same click)
   * from opening a feature once pick mode has already ended.
   */
  private consumingImageMapPick = false;
  private consumingParkingMapPick = false;
  public loading = true;
  public noApiKey = false;
  /** Feature id from the route to open once the map is ready. */
  private pendingDeepLinkFeatureId: string | null = null;
  /** Skip paramMap reactions while we are writing the URL ourselves. */
  private syncingFeatureUrl = false;

  private map?: MaplibreMap;
  private layers?: RockExplorerMapLayers;
  private apiKey = '';
  private features: FeatureCollection<Geometry> = emptyFeatureCollection();
  private draftGeometry: Geometry | null = null;
  private polygonVertices: Position[] = [];
  /** Feature being reshaped in `editPolygon` / redraw modes (panel may be closed). */
  private geometryEditFeature: RockExplorerFeature | null = null;
  private geometryRedrawMode: GeometryRedrawMode = null;
  private draggingVertexIndex: number | null = null;
  /** True once the pointer moved while dragging a draft vertex. */
  private vertexDragMoved = false;
  private draggingParkingId: string | null = null;
  /** Reused FeatureCollection during drag (mutate coords in place, avoid alloc). */
  private dragOverlayCollection: FeatureCollection<Geometry> | null = null;
  private cancelDrag: (() => void) | null = null;
  private suppressNextMapClick = false;
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private store = inject(Store);
  private rockExplorerService = inject(RockExplorerService);
  private galleryService = inject(GalleryService);
  private clipboardService = inject(ClipboardService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private transloco = inject(TranslocoService);
  private draftStore = inject(RockExplorerDraftStoreService);
  private draftSync = inject(RockExplorerDraftSyncService);
  private pendingImages = inject(RockExplorerPendingImageService);
  private uploadService = inject(UploadService);
  private mobileMediaQuery?: MediaQueryList;
  private mobileMediaListener?: (event: MediaQueryListEvent) => void;
  private imageLocationsRequestId = 0;
  private imageLocationsData: FeatureCollection<Geometry> =
    emptyFeatureCollection();
  private readonly imageHover = new RockExplorerImageHoverPopup();
  /** Guards async getClusterLeaves against stale mousemove results. */
  private imageClusterHoverRequestId = 0;
  /** True for the rest of a map click after an image GPS marker pin is handled. */
  private consumingImageLocationClick = false;

  /** Live-tracking session (survives exit Record until component destroy). */
  private recordingSession: RockExplorerRecordingSession | null = null;
  /** IndexedDB local draft id for the active recording session. */
  private activeLocalId: string | null = null;
  private geolocateControl: GeolocateControl | null = null;
  private geoWatchId: number | null = null;
  private persistInFlight = false;
  private readonly onWindowOnline = (): void => {
    void this.flushDraftQueue();
  };
  private readonly onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      void this.flushDraftQueue();
    }
  };
  /** 409 device-lock clone dialog. */
  public deviceLockDialogVisible = false;
  private deviceLockLocalId: string | null = null;
  private deviceLockServerId: string | null = null;
  private deviceLockCloneInFlight = false;

  /** Compact publish dialog (RE-TRACK-11). */
  public publishDialogVisible = false;
  public publishPotential: string | null = null;
  public publishTitle = '';
  public publishDescription = '';
  public publishInFlight = false;
  private publishLocalId: string | null = null;
  @ViewChild('recordImageInput')
  private recordImageInput?: ElementRef<HTMLInputElement>;

  public get isCoordinatePickActive(): boolean {
    return (
      this.ui.pickingImageCoordinates() || this.ui.pickingParkingCoordinates()
    );
  }

  public get isMapOverlayInteractionActive(): boolean {
    return this.isCoordinatePickActive || this.ui.drawingPath();
  }

  constructor() {
    this.ui.commands$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((cmd) => this.handleUiCommand(cmd));
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (this.syncingFeatureUrl) {
          return;
        }
        this.onFeatureRouteParam(params.get('featureId'));
      });
    this.draftSync.deviceLockConflict$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        this.ngZone.run(() => {
          void this.handleDeviceLockConflict(event);
        });
      });
  }

  /**
   * Handle UI commands from the RockExplorerUiService.
   * @param cmd - The command to handle.
   */
  private handleUiCommand(cmd: RockExplorerCommand): void {
    switch (cmd.type) {
      case 'setDrawMode':
        this.setRockExplorerDrawMode(cmd.mode);
        break;
      case 'cancelPointDraw':
        this.cancelPointDraw();
        break;
      case 'undoPolygonVertex':
        this.undoPolygonVertex();
        break;
      case 'finishPolygon':
        this.finishPolygon();
        break;
      case 'cancelPolygonDraw':
        this.cancelPolygonDraw();
        break;
      case 'switchMapStyle':
        this.switchMapStyle(cmd.style);
        break;
      case 'filtersChange':
        this.onFiltersChange(cmd.filters);
        break;
      case 'cancelImageCoordinatePick':
        this.cancelImageCoordinatePick();
        break;
      case 'cancelParkingCoordinatePick':
        this.cancelParkingCoordinatePick();
        break;
      case 'cancelPathDraw':
        this.cancelPathDraw();
        break;
      case 'deletePathVertex':
        this.panel?.misc?.deletePathVertex();
        break;
      case 'finishPathDraw':
        this.panel?.misc?.finishPathDraw();
        break;
      case 'closePanel':
        this.closePanel();
        break;
      case 'focusOnMap':
        this.focusActiveFeature();
        break;
      case 'shareFeature':
        this.shareActiveFeature();
        break;
      case 'editGeometry':
        this.startPolygonEdit();
        break;
      case 'redrawAsPoint':
        this.startRedrawAsPoint();
        break;
      case 'redrawAsPolygon':
        this.startRedrawAsPolygon();
        break;
      case 'redrawFromContent':
        this.redrawGeometryFromOverlays();
        break;
      case 'deleteRequest':
        this.confirmDelete(cmd.event);
        break;
      case 'saveFeature':
        this.onPanelSaveFeature(cmd.feature);
        break;
      case 'imagesChanged':
        this.onPanelImagesChanged();
        break;
      case 'imageEditModeChange':
        this.onImageEditModeChange(cmd.editMode);
        break;
      case 'imageMapPickChange':
        this.onImageMapPickChange(cmd.active);
        break;
      case 'coordinatesPreviewChange':
        this.refreshImageLocationsFromGallery();
        break;
      case 'imagesLoaded':
        this.onPanelGalleryImagesLoaded();
        break;
      case 'focusCoordinates':
        this.focusImageCoordinates(cmd.coordinates);
        break;
      case 'miscEditModeChange':
        this.onMiscEditModeChange(cmd.editMode);
        break;
      case 'parkingMapPickChange':
        this.onParkingMapPickChange(cmd.active);
        break;
      case 'pathDrawChange':
        this.onPathDrawChange(cmd.active);
        break;
      case 'pathDraftChange':
        this.onPathDraftChange();
        break;
      case 'miscPreviewChange':
        this.onMiscPreviewChange();
        break;
      case 'miscSaved':
        this.onMiscSaved(cmd.feature);
        break;
      case 'focusPathGeometry':
        this.fitMapToPositions(cmd.positions);
        break;
      case 'enterRecord':
        this.enterRecordMode();
        break;
      case 'exitRecord':
        this.exitRecordMode();
        break;
      case 'pauseRecording':
        this.pauseRecording();
        break;
      case 'resumeRecording':
        this.resumeRecording();
        break;
      case 'finishRecordPath':
        this.finishRecordPath();
        break;
      case 'newRecordPath':
        this.newRecordPath();
        break;
      case 'syncNow':
        void this.onSyncNow();
        break;
      case 'openSessionsPanel':
        this.ui.sessionsPanelOpen.set(true);
        break;
      case 'closeSessionsPanel':
        this.ui.sessionsPanelOpen.set(false);
        break;
      case 'continueDraft':
        void this.continueDraft(cmd.localId);
        break;
      case 'publishDraft':
        void this.beginPublishDraft(cmd.localId);
        break;
      case 'addRecordImage':
        this.triggerAddRecordImage();
        break;
      case 'editRecordInfo':
        void this.editRecordInfo();
        break;
      case 'deleteDraft':
        this.confirmDeleteDraft(cmd.localId, cmd.event);
        break;
    }
  }

  private syncPolygonVertexCount(): void {
    this.ui.polygonVertexCount.set(this.polygonVertices.length);
    this.ui.polygonSelfIntersecting.set(
      polygonRingSelfIntersects(this.polygonVertices),
    );
  }

  private setGeometryEditFeature(feature: RockExplorerFeature | null): void {
    this.geometryEditFeature = feature;
    this.ui.geometryEditActive.set(feature != null);
  }

  ngAfterViewInit() {
    this.bindMobileViewport();
    this.rebuildEnumOptions();
    void this.probeDraftStorage();
    window.addEventListener('online', this.onWindowOnline);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.rebuildEnumOptions();
        this.cdr.detectChanges();
      });
    forkJoin([
      this.store.select(selectInstanceSettingsState).pipe(take(1)),
      this.rockExplorerService.getFeaturesGeoJSON(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([settings, collection]) => {
          this.apiKey = settings.maptilerApiKey;
          this.features = collection;
          this.loading = false;
          if (!this.apiKey) {
            this.noApiKey = true;
            this.cdr.detectChanges();
            return;
          }
          this.cdr.detectChanges();
          this.initMap();
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(marker('rockExplorer.loadError')),
          });
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy() {
    window.removeEventListener('online', this.onWindowOnline);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    if (this.mobileMediaQuery && this.mobileMediaListener) {
      this.mobileMediaQuery.removeEventListener(
        'change',
        this.mobileMediaListener,
      );
    }
    this.cancelDragListeners();
    this.stopGeoWatch();
    this.imageHover.hide({ force: true });
    this.map?.remove();
  }

  public setRockExplorerDrawMode(mode: RockExplorerDrawMode) {
    if (this.ui.recordModeActive()) {
      return;
    }
    this.endVertexDrag();
    this.cancelImageCoordinatePick();
    this.ui.drawMode.set(mode);
    this.polygonVertices = [];
    this.syncPolygonVertexCount();
    this.setGeometryEditFeature(null);
    this.geometryRedrawMode = null;
    this.clearDraftLayer();
    if (mode === 'point' || mode === 'polygon') {
      this.ui.showFilters.set(false);
      this.closePanel();
    }
    this.cdr.detectChanges();
  }

  public undoPolygonVertex() {
    if (this.ui.drawMode() !== 'polygon' || this.polygonVertices.length === 0) {
      return;
    }
    this.polygonVertices.pop();
    this.syncPolygonVertexCount();
    this.renderPolygonDraft();
  }

  public cancelPolygonDraw() {
    const resumeFeatureId = this.geometryEditFeature?.id ?? null;
    this.endVertexDrag();
    this.polygonVertices = [];
    this.clearDraftLayer();
    this.setGeometryEditFeature(null);
    this.geometryRedrawMode = null;
    this.ui.drawMode.set('select');
    this.syncPolygonVertexCount();
    if (resumeFeatureId) {
      this.openEditPanel(resumeFeatureId);
    }
    this.cdr.detectChanges();
  }

  public cancelPointDraw() {
    const resumeFeatureId = this.geometryEditFeature?.id ?? null;
    this.setGeometryEditFeature(null);
    this.geometryRedrawMode = null;
    this.ui.drawMode.set('select');
    this.clearDraftLayer();
    if (resumeFeatureId) {
      this.openEditPanel(resumeFeatureId);
    } else {
      this.cdr.detectChanges();
    }
  }

  public startPolygonEdit() {
    const feature = this.ui.editingFeature();
    const geometry = feature?.geometry;
    if (!feature?.id || geometry?.type !== 'Polygon') {
      return;
    }
    const ring = geometry.coordinates[0] ?? [];
    if (ring.length < 4) {
      return;
    }
    // Drop the closing duplicate of the ring.
    this.polygonVertices = ring
      .slice(0, -1)
      .map((coord) => [coord[0], coord[1]]);
    this.setGeometryEditFeature(feature);
    this.geometryRedrawMode = null;
    this.ui.drawMode.set('editPolygon');
    this.ui.panelOpen.set(false);
    this.ui.featureFormActive.set(false);
    this.syncPolygonVertexCount();
    this.renderPolygonDraft();
    this.focusActiveFeature();
    this.cdr.detectChanges();
  }

  /** Start redrawing the current feature as a point. */
  public startRedrawAsPoint() {
    if (!this.beginGeometryRedraw()) {
      return;
    }
    this.geometryRedrawMode = 'point';
    this.ui.drawMode.set('point');
    this.polygonVertices = [];
    this.syncPolygonVertexCount();
    this.clearDraftLayer();
    if (this.map) {
      this.map.getCanvas().style.cursor = 'crosshair';
    }
    this.cdr.detectChanges();
  }

  /** Start redrawing the current feature as a polygon. */
  public startRedrawAsPolygon() {
    if (!this.beginGeometryRedraw()) {
      return;
    }
    this.geometryRedrawMode = 'polygon';
    this.ui.drawMode.set('polygon');
    this.polygonVertices = [];
    this.syncPolygonVertexCount();
    this.clearDraftLayer();
    if (this.map) {
      this.map.getCanvas().style.cursor = 'crosshair';
    }
    this.cdr.detectChanges();
  }

  /** Redraw the current feature from the overlay points (image GPS + parking + path vertices). */
  public redrawGeometryFromOverlays() {
    const feature = this.ui.editingFeature();
    if (!feature?.id || this.ui.saving()) {
      return;
    }
    const geometry = geometryFromOverlayPoints(
      this.collectFeatureOverlayPoints(),
    );
    if (!geometry) {
      return;
    }
    this.setGeometryEditFeature(feature);
    this.saveFeatureGeometry(geometry);
  }

  /** Begin geometry redraw. */
  private beginGeometryRedraw(): boolean {
    const feature = this.ui.editingFeature();
    if (!feature?.id) {
      return false;
    }
    this.endVertexDrag();
    this.cancelImageCoordinatePick();
    this.cancelParkingCoordinatePick();
    this.cancelPathDraw();
    this.setGeometryEditFeature(feature);
    this.ui.panelOpen.set(false);
    this.ui.featureFormActive.set(false);
    return true;
  }

  /** Image GPS + parking + path vertices for the open feature. */
  private collectFeatureOverlayPoints(): Position[] {
    const points: Position[] = [];
    for (const feature of this.imageLocationsData.features) {
      if (feature.geometry?.type === 'Point') {
        points.push([
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1],
        ]);
      }
    }
    const parkings =
      this.panel?.misc?.parkingSites ??
      this.ui.editingFeature()?.parkingSites ??
      [];
    for (const site of parkings) {
      if (site.lat != null && site.lng != null) {
        points.push([site.lng, site.lat]);
      }
    }
    const paths =
      this.panel?.misc?.paths ?? this.ui.editingFeature()?.paths ?? [];
    for (const path of paths) {
      for (const coord of path.geometry?.coordinates ?? []) {
        if (coord.length >= 2) {
          points.push([coord[0], coord[1]]);
        }
      }
    }
    return points;
  }

  /**
   * Bind the mobile viewport media query to the RockExplorerUiService.
   */
  private bindMobileViewport() {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    this.mobileMediaQuery = window.matchMedia('(max-width: 640px)');
    this.ui.isMobileViewport.set(this.mobileMediaQuery.matches);
    this.mobileMediaListener = (event: MediaQueryListEvent) => {
      this.ui.isMobileViewport.set(event.matches);
      this.cdr.detectChanges();
    };
    this.mobileMediaQuery.addEventListener('change', this.mobileMediaListener);
  }

  public onFiltersChange(filters: RockExplorerFilters) {
    this.lastFilters = filters;
    this.reloadFeatures(filters, { fit: true });
  }

  public switchMapStyle(style: MapStyles) {
    if (!this.map || !this.apiKey || this.ui.mapStyle() === style) {
      return;
    }
    this.ui.mapStyle.set(style);
    this.map.setStyle(maptilerStyleUrl(this.apiKey, style));
    this.map.once('style.load', () => {
      void this.rebindMapLayers().then(() => {
        if (this.ui.isPolygonToolActive()) {
          this.renderPolygonDraft();
        } else if (this.draftGeometry && this.ui.featureFormActive()) {
          this.renderDraftGeometry(this.draftGeometry);
        } else if (this.ui.drawingPath()) {
          this.refreshMiscOverlays();
        }
        if (this.ui.editingFeature()?.id) {
          this.loadFeatureImageLocations(this.ui.editingFeature().id);
          this.refreshMiscOverlays();
        }
      });
    });
  }

  public onPanelSaveFeature(feature: RockExplorerFeature) {
    if (!this.draftGeometry && !this.ui.editingFeature()) {
      return;
    }
    feature.geometry = (this.draftGeometry ||
      this.ui.editingFeature()!.geometry) as Geometry;

    this.ui.saving.set(true);
    const request$ = feature.id
      ? this.rockExplorerService.updateFeature(feature)
      : this.rockExplorerService.createFeature(feature);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.ui.saving.set(false);
        this.setRockExplorerDrawMode('select');
        this.reloadFeatures(this.lastFilters);
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate(marker('rockExplorer.saveSuccess')),
        });
        if (saved?.id) {
          this.applyFeatureToPanel(saved, false);
        } else {
          this.closePanel();
        }
      },
      error: () => {
        this.ui.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate(marker('rockExplorer.saveError')),
        });
      },
    });
  }

  public onImageEditModeChange(editMode: boolean): void {
    if (!editMode) {
      this.setImageCoordinatePickActive(false);
    }
  }

  public onImageMapPickChange(active: boolean): void {
    if (active) {
      this.cancelParkingCoordinatePick();
      this.cancelPathDraw();
    }
    this.setImageCoordinatePickActive(active);
  }

  public onMiscEditModeChange(editMode: boolean): void {
    this.miscEditMode = editMode;
    if (!editMode) {
      this.cancelParkingCoordinatePick();
      this.cancelPathDraw();
    }
  }

  public onParkingMapPickChange(active: boolean): void {
    if (active) {
      this.cancelImageCoordinatePick();
      this.cancelPathDraw();
    }
    this.setParkingCoordinatePickActive(active);
  }

  public onPathDrawChange(active: boolean): void {
    if (active && this.ui.recordModeActive()) {
      return;
    }
    if (active) {
      this.cancelImageCoordinatePick();
      this.cancelParkingCoordinatePick();
      if (this.ui.drawMode() !== 'select') {
        this.setRockExplorerDrawMode('select');
      }
      this.map?.doubleClickZoom.disable();
    } else {
      this.map?.doubleClickZoom.enable();
    }
    this.ui.drawingPath.set(active);
    this.updateMapPickPanelVisibility();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.ui.isPolygonToolActive()
    ) {
      this.map.getCanvas().style.cursor = active ? 'crosshair' : '';
    }
    this.syncPathDraftStateFromMisc();
    this.refreshMiscOverlays();
    if (active) {
      this.fitMapToPositions(this.panel?.misc?.pathDraftVertices ?? []);
    }
    this.cdr.detectChanges();
  }

  public onPathDraftChange(): void {
    this.syncPathDraftLayer();
  }

  public onMiscPreviewChange(): void {
    this.refreshMiscOverlays();
    this.cdr.detectChanges();
  }

  public onMiscSaved(feature: RockExplorerFeature): void {
    if (
      this.ui.editingFeature() &&
      feature.id === this.ui.editingFeature().id
    ) {
      this.ui.editingFeature().parkingSites = feature.parkingSites;
      this.ui.editingFeature().paths = feature.paths;
    }
    this.refreshMiscOverlays();
  }

  public cancelParkingCoordinatePick(): void {
    this.panel?.misc?.cancelMapPick();
    this.setParkingCoordinatePickActive(false);
  }

  public cancelPathDraw(): void {
    this.panel?.misc?.cancelPathDraw();
    this.ui.drawingPath.set(false);
    this.ui.pathDraftVertexCount.set(0);
    this.ui.selectedPathVertexIndex.set(null);
    this.map?.doubleClickZoom.enable();
    this.updateMapPickPanelVisibility();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.ui.isPolygonToolActive()
    ) {
      this.map.getCanvas().style.cursor = this.isCoordinatePickActive
        ? 'crosshair'
        : '';
    }
  }

  public cancelImageCoordinatePick(): void {
    this.panel?.gallery?.cancelMapPick();
    this.setImageCoordinatePickActive(false);
  }

  public refreshImageLocationsFromGallery(): void {
    if (!this.panel?.gallery) {
      return;
    }
    this.setImageLocations({
      type: 'FeatureCollection',
      features: this.panel.gallery.getGeotaggedMapFeatures(),
    });
  }

  public onPanelGalleryImagesLoaded(): void {
    if (this.panel?.gallery?.editMode) {
      this.refreshImageLocationsFromGallery();
      return;
    }
    if (this.panel?.gallery && this.panel.gallery.images.length > 0) {
      this.refreshImageLocationsFromGallery();
    }
  }

  public focusImageCoordinates(coordinates: Coordinates): void {
    if (!this.map) {
      return;
    }
    this.imageHover.hide({ force: true });
    this.map.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: Math.max(this.map.getZoom(), 17),
      duration: 700,
    });
  }

  private setImageCoordinatePickActive(active: boolean): void {
    if (active) {
      this.imageHover.hide({ force: true });
    }
    this.ui.pickingImageCoordinates.set(active);
    this.updateMapPickPanelVisibility();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.ui.isPolygonToolActive()
    ) {
      this.map.getCanvas().style.cursor = this.isMapOverlayInteractionActive
        ? 'crosshair'
        : '';
    }
    this.cdr.detectChanges();
  }

  private setParkingCoordinatePickActive(active: boolean): void {
    if (active) {
      this.imageHover.hide({ force: true });
    }
    this.ui.pickingParkingCoordinates.set(active);
    this.updateMapPickPanelVisibility();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.ui.isPolygonToolActive()
    ) {
      this.map.getCanvas().style.cursor = this.isMapOverlayInteractionActive
        ? 'crosshair'
        : '';
    }
    this.cdr.detectChanges();
  }

  private updateMapPickPanelVisibility(): void {
    this.ui.mapPickHidesPanel.set(
      this.ui.drawingPath() ||
        (this.isCoordinatePickActive && this.ui.isMobileViewport()),
    );
  }

  private applyImageCoordinatePick(lat: number, lng: number): boolean {
    if (!this.ui.pickingImageCoordinates() && !this.consumingImageMapPick) {
      return false;
    }
    if (this.ui.pickingImageCoordinates()) {
      this.consumingImageMapPick = true;
      this.panel?.gallery?.applyMapPick(lat, lng);
      setTimeout(() => {
        this.consumingImageMapPick = false;
      }, 0);
    }
    return true;
  }

  private applyParkingCoordinatePick(lat: number, lng: number): boolean {
    if (!this.ui.pickingParkingCoordinates() && !this.consumingParkingMapPick) {
      return false;
    }
    if (this.ui.pickingParkingCoordinates()) {
      this.consumingParkingMapPick = true;
      this.panel?.misc?.applyMapPick(lat, lng);
      setTimeout(() => {
        this.consumingParkingMapPick = false;
      }, 0);
    }
    return true;
  }

  private applyMapOverlayPick(lat: number, lng: number): boolean {
    if (this.applyImageCoordinatePick(lat, lng)) {
      return true;
    }
    if (this.applyParkingCoordinatePick(lat, lng)) {
      return true;
    }
    if (this.ui.drawingPath()) {
      this.panel?.misc?.applyPathVertex(lng, lat);
      return true;
    }
    return false;
  }

  private onFeatureSelectClick(event: MapLayerMouseEvent) {
    if (this.consumingImageLocationClick) {
      return;
    }
    event.originalEvent.stopPropagation();
    if (this.applyMapOverlayPick(event.lngLat.lat, event.lngLat.lng)) {
      return;
    }
    const id = event.features?.[0]?.properties?.['id'];
    if (!id || this.ui.drawMode() !== 'select') {
      return;
    }
    this.openEditPanel(String(id));
  }

  public focusActiveFeature() {
    const geometry =
      this.ui.editingFeature()?.geometry ?? this.draftGeometry ?? null;
    if (!this.map || !geometry) {
      return;
    }
    const padding = this.ui.isMobileViewport()
      ? { top: 64, bottom: 320, left: 48, right: 48 }
      : { top: 64, bottom: 64, left: 48, right: 380 };
    fitMapToGeometry(this.map, geometry, {
      padding,
      maxZoom: geometry.type === 'Point' ? 17 : 18,
      duration: 700,
    });
  }

  /** Fit the map to path/polygon draft vertices (used when starting path edit). */
  public fitMapToPositions(positions: Position[]): void {
    if (!this.map || positions.length === 0) {
      return;
    }
    // Panel is hidden during path edit — keep padding balanced.
    const padding = this.ui.isMobileViewport()
      ? { top: 64, bottom: 120, left: 48, right: 48 }
      : { top: 64, bottom: 64, left: 48, right: 48 };
    fitMapPositions(this.map, positions, {
      padding,
      maxZoom: positions.length === 1 ? 17 : 18,
      duration: 700,
    });
  }

  public confirmDelete(event: Event) {
    if (!this.ui.editingFeature()?.id) {
      return;
    }
    this.confirmationService.confirm({
      target: event.currentTarget ?? event.target,
      message: this.transloco.translate(marker('rockExplorer.deleteConfirm')),
      acceptLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteYes'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.transloco.translate(
        marker('rockExplorer.imageDeleteNo'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteFeature();
      },
    });
  }

  public closePanel(options?: { skipUrlSync?: boolean }) {
    this.ui.panelOpen.set(false);
    this.miscEditMode = false;
    this.cancelImageCoordinatePick();
    this.cancelParkingCoordinatePick();
    this.cancelPathDraw();
    this.ui.resetPanelSession();
    this.draftGeometry = null;
    this.clearDraftLayer();
    this.clearImageLocations();
    this.clearMiscOverlays();
    this.applySelectionFilters();
    if (!options?.skipUrlSync) {
      this.syncFeatureUrl(null);
    }
  }

  public finishPolygon() {
    if (
      this.ui.drawMode() === 'editPolygon' ||
      this.geometryRedrawMode === 'polygon'
    ) {
      this.finishPolygonEdit();
      return;
    }
    if (
      this.ui.drawMode() !== 'polygon' ||
      this.polygonVertices.length < 3 ||
      polygonRingSelfIntersects(this.polygonVertices)
    ) {
      return;
    }
    this.openCreatePanel({
      type: 'Polygon',
      coordinates: [closedPolygonRing(this.polygonVertices)],
    });
    this.polygonVertices = [];
    this.syncPolygonVertexCount();
    this.ui.drawMode.set('select');
  }

  private finishPolygonEdit() {
    if (
      this.polygonVertices.length < 3 ||
      polygonRingSelfIntersects(this.polygonVertices)
    ) {
      return;
    }
    this.saveFeatureGeometry({
      type: 'Polygon',
      coordinates: [closedPolygonRing(this.polygonVertices)],
    });
  }

  private saveFeatureGeometry(geometry: Geometry) {
    const feature = this.geometryEditFeature ?? this.ui.editingFeature();
    if (!feature?.id || this.ui.saving()) {
      return;
    }
    feature.geometry = geometry;
    this.ui.saving.set(true);
    this.cdr.detectChanges();
    this.rockExplorerService
      .updateFeature(feature)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (saved) => {
          this.ui.saving.set(false);
          this.endVertexDrag();
          this.polygonVertices = [];
          this.syncPolygonVertexCount();
          this.clearDraftLayer();
          this.setGeometryEditFeature(null);
          this.geometryRedrawMode = null;
          this.ui.drawMode.set('select');
          if (this.map) {
            this.map.getCanvas().style.cursor = '';
          }
          this.reloadFeatures(this.lastFilters);
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate(
              marker('rockExplorer.saveSuccess'),
            ),
          });
          if (saved?.id) {
            this.applyFeatureToPanel(saved, false);
          }
          this.cdr.detectChanges();
        },
        error: () => {
          this.ui.saving.set(false);
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(marker('rockExplorer.saveError')),
          });
          this.cdr.detectChanges();
        },
      });
  }

  public onPanelImagesChanged(): void {
    this.reloadFeatures(this.lastFilters);
    // Prefer in-memory gallery geotags so dots don't vanish while a refetch runs.
    if (this.panel?.gallery) {
      this.refreshImageLocationsFromGallery();
    } else if (this.ui.editingFeature()?.id) {
      this.loadFeatureImageLocations(this.ui.editingFeature().id);
    }
  }

  private deleteFeature() {
    if (!this.ui.editingFeature()) {
      return;
    }
    this.rockExplorerService
      .deleteFeature(this.ui.editingFeature())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closePanel();
          this.reloadFeatures(this.lastFilters);
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate(
              marker('rockExplorer.deleteSuccess'),
            ),
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.deleteError'),
            ),
          });
        },
      });
  }

  private initMap() {
    const el = this.mapContainer?.nativeElement;
    if (!el) {
      return;
    }
    this.imageHover.setOnImageClick((galleryImageId) => {
      this.ngZone.run(() => this.openGalleryFromMapImage(galleryImageId));
    });
    // Create the map outside Angular — otherwise every pointer event (including
    // MapLibre internals) re-enters the zone and thrash-detects the open panel.
    this.ngZone.runOutsideAngular(() => {
      this.map = new MaplibreMap({
        container: el,
        style: maptilerStyleUrl(this.apiKey, this.ui.mapStyle()),
        center: [10, 50],
        zoom: 5,
      });
      this.map.addControl(new NavigationControl({}), 'top-right');
      this.geolocateControl = new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showAccuracyCircle: true,
      });
      this.map.addControl(this.geolocateControl, 'top-right');
      this.map.on('load', () => {
        void this.rebindMapLayers().then(() => {
          this.fitToFeatures();
          this.flushPendingDeepLink();
        });
        this.map!.on('mousedown', ROCK_EXPLORER_LAYERS.draftPoints, (event) =>
          this.onDraftVertexMouseDown(event),
        );
        this.map!.on('mousedown', ROCK_EXPLORER_LAYERS.parking, (event) =>
          this.onParkingMarkerMouseDown(event),
        );
        this.map!.on('mouseenter', ROCK_EXPLORER_LAYERS.draftPoints, () => {
          if (
            (this.ui.isPolygonToolActive() || this.ui.drawingPath()) &&
            this.map
          ) {
            this.map.getCanvas().style.cursor = 'grab';
          }
        });
        this.map!.on('mouseleave', ROCK_EXPLORER_LAYERS.draftPoints, () => {
          if (this.draggingVertexIndex == null && this.map) {
            this.map.getCanvas().style.cursor = this.ui.drawingPath()
              ? 'crosshair'
              : '';
          }
        });
        this.map!.on('mouseenter', ROCK_EXPLORER_LAYERS.parking, () => {
          if (this.canDragParkingMarkers() && this.map) {
            this.map.getCanvas().style.cursor = 'grab';
          }
        });
        this.map!.on('mouseleave', ROCK_EXPLORER_LAYERS.parking, () => {
          if (
            this.draggingParkingId == null &&
            this.draggingVertexIndex == null &&
            this.map &&
            !this.isMapOverlayInteractionActive
          ) {
            this.map.getCanvas().style.cursor = '';
          }
        });
        this.map!.on(
          'mousemove',
          ROCK_EXPLORER_LAYERS.imageLocations,
          (event) => this.onImageLocationMouseMove(event),
        );
        this.map!.on('mouseleave', ROCK_EXPLORER_LAYERS.imageLocations, () =>
          this.onImageLocationMouseLeave(),
        );
        this.map!.on('click', ROCK_EXPLORER_LAYERS.imageLocations, (event) =>
          this.ngZone.run(() => this.onImageLocationClick(event)),
        );
        for (const clusterLayerId of [
          ROCK_EXPLORER_LAYERS.imageClusters,
          ROCK_EXPLORER_LAYERS.imageClusterCount,
        ]) {
          this.map!.on('mouseenter', clusterLayerId, () => {
            if (this.map) {
              this.map.getCanvas().style.cursor = 'pointer';
            }
          });
          this.map!.on('mousemove', clusterLayerId, (event) =>
            this.onImageLocationMouseMove(event),
          );
          this.map!.on('mouseleave', clusterLayerId, () =>
            this.onImageLocationMouseLeave(),
          );
          this.map!.on('click', clusterLayerId, (event) =>
            this.ngZone.run(() => this.onImageLocationClick(event)),
          );
        }
        this.map!.on('click', (event) => {
          // Geometry drafting updates the map directly; only re-enter Angular for UI chrome.
          if (
            this.ui.drawingPath() ||
            this.ui.isPolygonToolActive() ||
            this.geometryRedrawMode === 'point'
          ) {
            this.onMapClick(event);
            this.ngZone.run(() => this.cdr.detectChanges());
            return;
          }
          this.ngZone.run(() => this.onMapClick(event));
        });
        this.map!.on('click', ROCK_EXPLORER_LAYERS.points, (event) =>
          this.ngZone.run(() => this.onFeatureSelectClick(event)),
        );
        this.map!.on('click', ROCK_EXPLORER_LAYERS.polygonsFill, (event) =>
          this.ngZone.run(() => this.onFeatureSelectClick(event)),
        );
      });
    });
  }

  private async rebindMapLayers(): Promise<void> {
    if (!this.map) {
      return;
    }
    this.layers = new RockExplorerMapLayers(this.map);
    await this.layers.addAll(this.features, this.imageLocationsData);
    this.applySelectionFilters();
  }

  private onMapClick(event: MapMouseEvent) {
    if (this.consumingImageLocationClick) {
      return;
    }
    this.imageHover.hide({ force: true });
    if (this.suppressNextMapClick) {
      this.suppressNextMapClick = false;
      return;
    }
    if (this.draggingVertexIndex != null || this.draggingParkingId != null) {
      return;
    }
    if (this.applyMapOverlayPick(event.lngLat.lat, event.lngLat.lng)) {
      return;
    }
    if (this.ui.drawMode() === 'point') {
      if (this.geometryRedrawMode === 'point' && this.geometryEditFeature) {
        this.ngZone.run(() =>
          this.saveFeatureGeometry({
            type: 'Point',
            coordinates: [event.lngLat.lng, event.lngLat.lat],
          }),
        );
        return;
      }
      this.ui.drawMode.set('select');
      this.openCreatePanel({
        type: 'Point',
        coordinates: [event.lngLat.lng, event.lngLat.lat],
      });
      return;
    }
    if (this.ui.drawMode() === 'polygon') {
      this.polygonVertices.push([event.lngLat.lng, event.lngLat.lat]);
      this.syncPolygonVertexCount();
      this.renderPolygonDraft();
    }
  }

  private canDragParkingMarkers(): boolean {
    return (
      this.miscEditMode &&
      !this.ui.pickingParkingCoordinates() &&
      !this.ui.drawingPath() &&
      !this.ui.isPolygonToolActive()
    );
  }

  private onParkingMarkerMouseDown(event: MapLayerMouseEvent) {
    if (!this.canDragParkingMarkers() || !this.map || !this.panel?.misc) {
      return;
    }
    const id = event.features?.[0]?.properties?.['id'];
    if (!id) {
      return;
    }
    event.preventDefault();
    this.draggingParkingId = String(id);
    this.suppressNextMapClick = true;
    this.dragOverlayCollection = {
      type: 'FeatureCollection',
      features: this.panel.misc.getParkingMapFeatures(),
    };
    this.map.dragPan.disable();
    this.map.getCanvas().style.cursor = 'grabbing';
    this.startDocumentDragListeners();
  }

  private onDraftVertexMouseDown(event: MapLayerMouseEvent) {
    if (
      (!this.ui.isPolygonToolActive() && !this.ui.drawingPath()) ||
      !this.map
    ) {
      return;
    }
    const feature = event.features?.[0];
    const index = Number(feature?.properties?.['vertexIndex']);
    const vertexCount = this.ui.drawingPath()
      ? (this.panel?.misc?.pathDraftVertices.length ?? 0)
      : this.polygonVertices.length;
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
      return;
    }
    event.preventDefault();
    this.draggingVertexIndex = index;
    this.vertexDragMoved = false;
    this.suppressNextMapClick = true;
    this.dragOverlayCollection = this.ui.drawingPath()
      ? (this.panel?.misc?.getPathDraftCollection() ?? null)
      : buildPolygonDraftCollection(this.polygonVertices);
    this.map.dragPan.disable();
    this.map.getCanvas().style.cursor = 'grabbing';
    this.startDocumentDragListeners();
  }

  /**
   * Document-level listeners registered outside NgZone — MapLibre canvas
   * listeners alone are not enough if the map was ever touched by Zone.js.
   */
  private startDocumentDragListeners() {
    this.cancelDragListeners();
    this.ngZone.runOutsideAngular(() => {
      this.cancelDrag = startDocumentDrag({
        onMove: (event) => this.onDocumentDragMove(event),
        onUp: () => this.endMapDrag(),
      });
    });
  }

  private onDocumentDragMove(event: MouseEvent) {
    if (
      !this.map ||
      (this.draggingParkingId == null && this.draggingVertexIndex == null)
    ) {
      return;
    }
    const rect = this.map.getCanvas().getBoundingClientRect();
    const lngLat = this.map.unproject([
      event.clientX - rect.left,
      event.clientY - rect.top,
    ]);
    this.applyDragLngLat(lngLat.lng, lngLat.lat);
  }

  private applyDragLngLat(lng: number, lat: number) {
    if (this.draggingParkingId) {
      this.panel?.misc?.moveParkingSite(this.draggingParkingId, lat, lng, true);
      if (this.dragOverlayCollection) {
        this.syncParkingDragCollectionCoords();
        this.layers?.setParking(this.dragOverlayCollection);
      }
      return;
    }
    if (this.draggingVertexIndex == null) {
      return;
    }
    this.vertexDragMoved = true;
    if (this.ui.drawingPath()) {
      const verts = this.panel?.misc?.pathDraftVertices;
      if (
        verts &&
        this.draggingVertexIndex >= 0 &&
        this.draggingVertexIndex < verts.length
      ) {
        verts[this.draggingVertexIndex][0] = lng;
        verts[this.draggingVertexIndex][1] = lat;
      }
      if (this.dragOverlayCollection) {
        this.layers?.setDraft(this.dragOverlayCollection);
      }
      return;
    }
    this.polygonVertices[this.draggingVertexIndex][0] = lng;
    this.polygonVertices[this.draggingVertexIndex][1] = lat;
    this.dragOverlayCollection = buildPolygonDraftCollection(
      this.polygonVertices,
    );
    this.layers?.setDraft(this.dragOverlayCollection);
    this.ui.polygonSelfIntersecting.set(
      polygonRingSelfIntersects(this.polygonVertices),
    );
  }

  /** Parking features are rebuilt as new objects; refresh coords from model. */
  private syncParkingDragCollectionCoords() {
    if (!this.dragOverlayCollection || !this.panel?.misc) {
      return;
    }
    for (const feature of this.dragOverlayCollection.features) {
      if (feature.geometry.type !== 'Point') {
        continue;
      }
      const id = String(feature.properties?.['id'] ?? '');
      const site = this.panel.misc.parkingSites.find((s) => s.id === id);
      if (site?.lng != null && site?.lat != null) {
        feature.geometry.coordinates[0] = site.lng;
        feature.geometry.coordinates[1] = site.lat;
      }
    }
  }

  private endMapDrag() {
    this.cancelDragListeners();
    this.dragOverlayCollection = null;

    if (this.draggingParkingId) {
      this.draggingParkingId = null;
      this.map?.dragPan.enable();
      if (this.map && !this.isMapOverlayInteractionActive) {
        this.map.getCanvas().style.cursor = '';
      }
      this.ngZone.run(() => {
        this.panel?.misc?.onParkingFieldChange();
        this.cdr.detectChanges();
      });
      return;
    }
    this.endVertexDrag();
  }

  private endVertexDrag() {
    if (this.draggingVertexIndex == null) {
      return;
    }
    const index = this.draggingVertexIndex;
    const wasClick = !this.vertexDragMoved;
    this.draggingVertexIndex = null;
    this.vertexDragMoved = false;
    this.dragOverlayCollection = null;
    this.cancelDragListeners();
    this.map?.dragPan.enable();
    if (this.map) {
      this.map.getCanvas().style.cursor =
        this.ui.isPolygonToolActive() || this.ui.drawingPath() ? 'grab' : '';
    }
    if (!this.ui.drawingPath() || !this.panel?.misc) {
      return;
    }
    const nextSelected = wasClick ? index : null;
    const selectionChanged =
      this.panel.misc.selectedPathVertexIndex !== nextSelected;
    this.panel.misc.selectedPathVertexIndex = nextSelected;
    this.ui.selectedPathVertexIndex.set(nextSelected);
    if (selectionChanged) {
      this.syncPathDraftLayer();
      this.ngZone.run(() => this.cdr.detectChanges());
    }
  }

  private cancelDragListeners() {
    this.cancelDrag?.();
    this.cancelDrag = null;
  }

  private openCreatePanel(geometry: Geometry) {
    this.ui.featureFormActive.set(true);
    this.ui.editingFeature.set(null);
    this.draftGeometry = geometry;
    this.clearImageLocations();
    this.clearMiscOverlays();
    this.ui.panelOpen.set(true);
    this.renderDraftGeometry(geometry);
    this.applySelectionFilters();
    this.syncFeatureUrl(null);
    this.cdr.detectChanges();
    queueMicrotask(() => this.panel?.showCreateForm());
  }

  public openEditPanel(id: string, options?: { focus?: boolean }) {
    if (this.ui.panelOpen() && this.ui.editingFeature()?.id === id) {
      if (options?.focus) {
        this.focusActiveFeature();
      }
      return;
    }
    this.rockExplorerService
      .getFeature(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (feature) => {
          this.applyFeatureToPanel(feature, false);
          if (options?.focus) {
            queueMicrotask(() => this.focusActiveFeature());
          }
        },
        error: () => {
          this.pendingDeepLinkFeatureId = null;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.featureNotFound'),
            ),
          });
          this.syncFeatureUrl(null);
        },
      });
  }

  private applyFeatureToPanel(
    feature: RockExplorerFeature,
    formActive: boolean,
  ) {
    this.ui.featureFormActive.set(formActive);
    this.ui.editingFeature.set(feature);
    this.draftGeometry = feature.geometry;
    this.ui.panelOpen.set(true);
    this.applySelectionFilters();
    this.refreshMiscOverlaysFromFeature(feature);
    if (feature.id) {
      this.loadFeatureImageLocations(feature.id);
    }
    this.syncFeatureUrl(feature.id ?? null);
    this.cdr.detectChanges();
    queueMicrotask(() => this.panel?.showFeature(feature, formActive));
  }

  private onFeatureRouteParam(featureId: string | null) {
    const currentId = this.ui.editingFeature()?.id ?? null;
    if (featureId === currentId) {
      return;
    }
    if (featureId) {
      if (!this.map) {
        this.pendingDeepLinkFeatureId = featureId;
        return;
      }
      this.openEditPanel(featureId, { focus: true });
      return;
    }
    this.pendingDeepLinkFeatureId = null;
    if (this.ui.panelOpen() && currentId) {
      this.closePanel({ skipUrlSync: true });
    }
  }

  private flushPendingDeepLink() {
    const id = this.pendingDeepLinkFeatureId;
    if (!id) {
      return;
    }
    this.pendingDeepLinkFeatureId = null;
    this.openEditPanel(id, { focus: true });
  }

  private syncFeatureUrl(featureId: string | null) {
    const current = this.route.snapshot.paramMap.get('featureId');
    if ((featureId ?? null) === (current ?? null)) {
      return;
    }
    this.syncingFeatureUrl = true;
    void this.router
      .navigate(
        featureId ? ['/rock-explorer', featureId] : ['/rock-explorer'],
        {
          replaceUrl: true,
        },
      )
      .finally(() => {
        this.syncingFeatureUrl = false;
      });
  }

  private shareActiveFeature() {
    const id = this.ui.editingFeature()?.id;
    if (!id) {
      return;
    }
    const path = this.router.serializeUrl(
      this.router.createUrlTree(['/rock-explorer', id]),
    );
    this.clipboardService.copyTextToClipboard(
      `${window.location.origin}${path}`,
      {
        successSummary: this.transloco.translate(
          marker('rockExplorer.shareSuccessTitle'),
        ),
        successDetail: this.transloco.translate(
          marker('rockExplorer.shareSuccessDetail'),
        ),
      },
    );
  }

  private rebuildEnumOptions() {
    this.ui.potentialOptions.set(
      Object.values(RockExplorerPotential).map((value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.potential.${value}`),
      })),
    );
    this.ui.rockQualityOptions.set(
      Object.values(RockExplorerRockQuality).map((value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.rockQuality.${value}`),
      })),
    );
    this.ui.rockTypeOptions.set(
      Object.values(RockExplorerRockType).map((value) => ({
        value,
        label: this.transloco.translate(`rockExplorer.rockType.${value}`),
      })),
    );
  }

  private reloadFeatures(
    filters: {
      potential?: string;
      rockQuality?: string;
      rockType?: string;
    } = {},
    options: { fit?: boolean } = {},
  ) {
    this.rockExplorerService
      .getFeaturesGeoJSON(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((collection) => {
        this.features = collection;
        this.layers?.setFeatures(collection);
        if (options.fit) {
          this.fitToFeatures();
        }
      });
  }

  private applySelectionFilters() {
    const id = this.ui.editingFeature()?.id;
    this.layers?.applySelectionFilters(id ? [id] : []);
  }

  private fitToFeatures() {
    if (!this.map) {
      return;
    }
    fitMapToFeatureCollection(this.map, this.features, {
      padding: 48,
      maxZoom: 16,
      duration: 700,
    });
  }

  private renderPolygonDraft() {
    this.layers?.setDraft(buildPolygonDraftCollection(this.polygonVertices));
  }

  private renderDraftGeometry(geometry: Geometry) {
    this.layers?.setDraft(buildDraftGeometryPreview(geometry));
  }

  private clearDraftLayer() {
    this.layers?.clearDraft();
  }

  private loadFeatureImageLocations(featureId: string) {
    const requestId = ++this.imageLocationsRequestId;
    this.galleryService
      .getGalleryImages({
        page: 1,
        per_page: 100,
        'tag-object-type': ObjectType.RockExplorerFeature,
        'tag-object-id': featureId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          if (
            requestId !== this.imageLocationsRequestId ||
            this.ui.editingFeature()?.id !== featureId
          ) {
            return;
          }
          // Don't overwrite live edit-mode GPS previews with a stale server list.
          if (this.panel?.gallery?.editMode) {
            this.refreshImageLocationsFromGallery();
            return;
          }
          this.setImageLocations({
            type: 'FeatureCollection',
            features: page.items
              .map((image) => this.galleryImageToMapFeature(image))
              .filter((feature): feature is Feature => feature != null),
          });
        },
        error: () => {
          if (requestId === this.imageLocationsRequestId) {
            this.clearImageLocations();
          }
        },
      });
  }

  private galleryImageToMapFeature(image: GalleryImage): Feature | null {
    const lat = image.lat;
    const lng = image.lng;
    if (lat == null || lng == null || !image.image) {
      return null;
    }
    const thumbnailUrl =
      image.image.thumbnailM ||
      image.image.thumbnailS ||
      image.image.path ||
      '';
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: {
        galleryImageId: image.id,
        thumbnailUrl,
        description: image.description ?? '',
      },
    };
  }

  private clearImageLocations() {
    this.imageLocationsRequestId++;
    this.imageHover.hide({ force: true });
    this.setImageLocations({ type: 'FeatureCollection', features: [] });
  }

  private clearMiscOverlays() {
    this.layers?.clearMiscOverlays(this.ui.isPolygonToolActive());
  }

  private refreshMiscOverlaysFromFeature(feature: RockExplorerFeature): void {
    this.layers?.setParking({
      type: 'FeatureCollection',
      features: (feature.parkingSites ?? [])
        .filter((site) => site.lat != null && site.lng != null)
        .map((site) => ({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [site.lng as number, site.lat as number],
          },
          properties: {
            id: site.id,
            title: site.title,
            description: site.description,
            type: 'PARKING',
          },
        })),
    });
    this.layers?.setPaths({
      type: 'FeatureCollection',
      features: (feature.paths ?? [])
        .filter((path) => (path.geometry?.coordinates?.length ?? 0) >= 2)
        .map((path) => ({
          type: 'Feature' as const,
          geometry: path.geometry,
          properties: {
            id: path.id,
            title: path.title,
            description: path.description,
          },
        })),
    });
  }

  private refreshMiscOverlays(): void {
    if (!this.ui.editingFeature()) {
      this.clearMiscOverlays();
      return;
    }
    this.layers?.ensureMiscOverlayLayers();
    if (this.panel?.misc) {
      this.layers?.setParking({
        type: 'FeatureCollection',
        features: this.panel.misc.getParkingMapFeatures(),
      });
      this.layers?.setPaths({
        type: 'FeatureCollection',
        features: this.panel?.misc.getPathMapFeatures(),
      });
      if (this.ui.drawingPath()) {
        this.syncPathDraftLayer();
      } else if (!this.ui.isPolygonToolActive()) {
        // Path edit finished/cancelled — don't leave draft vertices (e.g. red selected).
        this.ui.pathDraftVertexCount.set(0);
        this.ui.selectedPathVertexIndex.set(null);
        this.clearDraftLayer();
      }
    } else {
      this.refreshMiscOverlaysFromFeature(this.ui.editingFeature());
    }
  }

  private syncPathDraftStateFromMisc(): void {
    this.ui.pathDraftVertexCount.set(
      this.panel?.misc?.pathDraftVertices.length ?? 0,
    );
    this.ui.selectedPathVertexIndex.set(
      this.panel?.misc?.selectedPathVertexIndex ?? null,
    );
  }

  /** Update draft map layer only — mirrors polygon `renderPolygonDraft`. */
  private syncPathDraftLayer(): void {
    this.syncPathDraftStateFromMisc();
    if (!this.ui.drawingPath() || !this.panel?.misc) {
      if (!this.ui.isPolygonToolActive()) {
        this.clearDraftLayer();
      }
      return;
    }
    this.layers?.setDraft(this.panel?.misc.getPathDraftCollection());
  }

  private setImageLocations(collection: FeatureCollection<Geometry>) {
    this.imageLocationsData = collection;
    this.layers?.setImageLocations(collection);
  }

  private onImageLocationMouseMove(event: MapLayerMouseEvent) {
    if (
      !this.map ||
      this.isMapOverlayInteractionActive ||
      this.ui.isPolygonToolActive()
    ) {
      return;
    }
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') {
      return;
    }
    const coordinates = (feature.geometry.coordinates as number[]).slice() as [
      number,
      number,
    ];
    const clusterId = feature.properties?.['cluster_id'];
    const pointCount = feature.properties?.['point_count'];
    if (clusterId != null && typeof pointCount === 'number') {
      void this.showClusterImageHover(clusterId, pointCount, coordinates);
      return;
    }
    // Invalidate any in-flight getClusterLeaves so a stale cluster popup
    // cannot overwrite this unclustered hover.
    this.imageClusterHoverRequestId++;
    this.imageHover.show(this.map, feature, coordinates);
  }

  private async showClusterImageHover(
    clusterId: number | string,
    pointCount: number,
    coordinates: [number, number],
  ): Promise<void> {
    if (!this.map) {
      return;
    }
    const requestId = ++this.imageClusterHoverRequestId;
    const featureKey = `cluster:${clusterId}`;
    const source = this.map.getSource(ROCK_EXPLORER_SOURCES.imageLocations) as
      GeoJSONSource | undefined;
    if (!source) {
      return;
    }
    try {
      const leaves = await source.getClusterLeaves(Number(clusterId), 1, 0);
      if (
        requestId !== this.imageClusterHoverRequestId ||
        !this.map ||
        this.isMapOverlayInteractionActive ||
        this.ui.isPolygonToolActive()
      ) {
        return;
      }
      const leaf = leaves[0];
      if (!leaf) {
        return;
      }
      this.imageHover.show(this.map, leaf, coordinates, {
        count: pointCount,
        featureKey,
      });
    } catch {
      // Ignore transient cluster-leaf errors during rapid hover / style switch.
    }
  }

  private onImageLocationMouseLeave() {
    this.imageClusterHoverRequestId++;
    this.imageHover.hide();
    if (
      this.map &&
      this.draggingVertexIndex == null &&
      !this.isMapOverlayInteractionActive &&
      !this.ui.isPolygonToolActive()
    ) {
      this.map.getCanvas().style.cursor = '';
    }
  }

  private onImageLocationClick(event: MapLayerMouseEvent) {
    if (
      !this.map ||
      this.isMapOverlayInteractionActive ||
      this.ui.isPolygonToolActive() ||
      this.ui.drawMode() !== 'select'
    ) {
      return;
    }
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') {
      return;
    }
    const coordinates = (feature.geometry.coordinates as number[]).slice() as [
      number,
      number,
    ];
    const clusterId = feature.properties?.['cluster_id'];
    if (clusterId != null) {
      void this.expandImageCluster(clusterId, coordinates);
      this.consumingImageLocationClick = true;
      setTimeout(() => {
        this.consumingImageLocationClick = false;
      }, 0);
      return;
    }
    this.imageHover.show(this.map, feature, coordinates, { pin: true });
    this.consumingImageLocationClick = true;
    setTimeout(() => {
      this.consumingImageLocationClick = false;
    }, 0);
  }

  private async expandImageCluster(
    clusterId: number | string,
    coordinates: [number, number],
  ): Promise<void> {
    if (!this.map) {
      return;
    }
    const source = this.map.getSource(ROCK_EXPLORER_SOURCES.imageLocations) as
      GeoJSONSource | undefined;
    if (!source) {
      return;
    }
    try {
      const zoom = await source.getClusterExpansionZoom(Number(clusterId));
      if (!this.map) {
        return;
      }
      this.map.easeTo({
        center: coordinates,
        zoom,
      });
    } catch {
      // Ignore if cluster no longer exists after data/style refresh.
    }
  }

  private openGalleryFromMapImage(galleryImageId: string): void {
    this.imageHover.hide({ force: true });
    if (!this.panel?.gallery) {
      return;
    }
    if (this.panel.panelActiveTab !== 'images') {
      this.panel.panelActiveTab = 'images';
    }
    this.panel.gallery.openGalleryById(galleryImageId);
    this.cdr.detectChanges();
  }

  private enterRecordMode(): void {
    void this.enterRecordModeAsync({ resume: true });
  }

  /**
   * Enter Record chrome. When resume=false (Continue draft), stay paused and
   * do not start GPS until the user hits Resume.
   */
  private async enterRecordModeAsync(options: {
    resume: boolean;
  }): Promise<void> {
    if (this.ui.recordModeActive()) {
      return;
    }
    if (!this.ui.storageOk()) {
      this.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.storageUnavailable'),
        ),
      });
      return;
    }
    if (!this.recordingSession) {
      if (!(await this.draftStore.canCreateDraft())) {
        this.messageService.add({
          severity: 'warn',
          summary: this.transloco.translate(
            marker('rockExplorer.draftCapReached'),
          ),
        });
        return;
      }
    }
    if (this.ui.isDrawToolActive()) {
      this.setRockExplorerDrawMode('select');
    }
    if (this.ui.drawingPath()) {
      this.cancelPathDraw();
    }
    this.closePanel();
    this.ui.showFilters.set(false);
    this.ui.drawMode.set('select');

    if (!this.recordingSession) {
      const localId = crypto.randomUUID();
      this.activeLocalId = localId;
      this.ui.activeLocalDraftId.set(localId);
      this.recordingSession = new RockExplorerRecordingSession(
        getOrCreateRecordingDeviceId(),
      );
      this.ui.syncStatus.set('pending');
    } else if (options.resume) {
      this.recordingSession.resume();
    } else {
      this.recordingSession.pause();
    }

    this.ui.recordModeActive.set(true);
    this.ui.hasRecordingSession.set(true);
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    if (options.resume && this.recordingSession.isRecording) {
      this.startGeoWatch();
      try {
        this.geolocateControl?.trigger();
      } catch {
        // Geolocate may throw if permissions pending; watch handles denial.
      }
    }
    this.cdr.detectChanges();
  }

  private async continueDraft(localId: string): Promise<void> {
    if (this.ui.recordModeActive()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.exitRecordBeforeSwitch'),
        ),
      });
      return;
    }
    if (!this.ui.storageOk()) {
      this.messageService.add({
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
    this.ui.activeLocalDraftId.set(localId);
    this.ui.syncStatus.set(draft.syncStatus);
    this.ui.hasRecordingSession.set(true);
    await this.enterRecordModeAsync({ resume: false });
  }

  private async beginPublishDraft(localId?: string): Promise<void> {
    if (this.ui.recordModeActive()) {
      this.messageService.add({
        severity: 'warn',
        summary: this.transloco.translate(
          marker('rockExplorer.exitBeforePublish'),
        ),
      });
      return;
    }

    const targetLocalId =
      localId ?? this.activeLocalId ?? this.ui.activeLocalDraftId();
    if (!targetLocalId) {
      this.messageService.add({
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
      this.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.publishNoDraft'),
        ),
      });
      return;
    }

    if (!this.draftSync.isOnline()) {
      this.messageService.add({
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
      this.messageService.add({
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
      this.ui.activeLocalDraftId.set(targetLocalId);
      this.ui.hasRecordingSession.set(true);
      this.syncRecordUiSignals();
    }

    this.publishLocalId = targetLocalId;
    this.publishPotential = this.recordingSession.feature.potential ?? null;
    this.publishTitle = this.recordingSession.feature.title ?? '';
    this.publishDescription = this.recordingSession.feature.description ?? '';
    this.publishDialogVisible = true;
    this.cdr.detectChanges();
  }

  public cancelPublishDialog(): void {
    if (this.publishInFlight) {
      return;
    }
    this.publishDialogVisible = false;
    this.publishLocalId = null;
    this.cdr.detectChanges();
  }

  public async confirmPublishDialog(): Promise<void> {
    if (this.publishInFlight || !this.publishLocalId) {
      return;
    }
    if (!this.publishPotential) {
      this.messageService.add({
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
      this.messageService.add({
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
      this.messageService.add({
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
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate(marker('rockExplorer.loadError')),
        });
        return;
      }

      session.feature.geometry = geometry;
      session.feature.status = 'published';
      session.feature.recordingDeviceId = null;
      session.feature.recordingState = null;
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
        this.ui.recordModeActive.set(false);
        this.recordingSession = null;
        this.activeLocalId = null;
        this.ui.activeLocalDraftId.set(null);
        this.ui.syncStatus.set(null);
        this.ui.hasRecordingSession.set(false);
        this.syncRecordUiSignals();
        if (this.layers) {
          this.layers.setPaths(emptyFeatureCollection());
        }
      }

      this.publishDialogVisible = false;
      this.publishLocalId = null;
      this.reloadFeatures(this.lastFilters);
      this.applyFeatureToPanel(published, false);
      this.messageService.add({
        severity: 'success',
        summary: this.transloco.translate(
          marker('rockExplorer.publishSuccess'),
        ),
      });
    } catch (err) {
      const locked = err instanceof HttpErrorResponse && err.status === 409;
      this.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          locked
            ? marker('rockExplorer.deviceLockTitle')
            : marker('rockExplorer.loadError'),
        ),
      });
    } finally {
      this.publishInFlight = false;
      this.cdr.detectChanges();
    }
  }

  private async collectPublishOverlayPoints(
    session: RockExplorerRecordingSession,
    localId: string,
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
    // Uploaded image pins currently on map for this feature (if any)
    for (const feature of this.imageLocationsData.features) {
      if (feature.geometry?.type === 'Point') {
        points.push([
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1],
        ]);
      }
    }
    const pendingPins = await this.pendingImages.listGpsPins(localId);
    for (const pin of pendingPins) {
      points.push([pin.lng, pin.lat]);
    }
    return points;
  }

  private triggerAddRecordImage(): void {
    if (!this.ui.recordModeActive() && !this.activeLocalId) {
      return;
    }
    this.recordImageInput?.nativeElement.click();
  }

  public onRecordImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    void this.addRecordImageFile(file);
  }

  private async addRecordImageFile(file: File): Promise<void> {
    const localId = this.activeLocalId ?? this.ui.activeLocalDraftId();
    if (!localId) {
      return;
    }
    if (!navigator.geolocation) {
      this.messageService.add({
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
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        });
      });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch {
      this.messageService.add({
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
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate(
            marker('rockExplorer.imageUploadSuccess'),
          ),
        });
      } catch {
        // Fall back to queue
        await this.pendingImages.enqueue(localId, file, lat, lng, file.name);
        this.messageService.add({
          severity: 'info',
          summary: this.transloco.translate(
            marker('rockExplorer.imageQueuedOffline'),
          ),
        });
      }
    } else {
      await this.pendingImages.enqueue(localId, file, lat, lng, file.name);
      this.messageService.add({
        severity: 'info',
        summary: this.transloco.translate(
          marker('rockExplorer.imageQueuedOffline'),
        ),
      });
    }
    this.cdr.detectChanges();
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

  private async editRecordInfo(): Promise<void> {
    const localId = this.activeLocalId ?? this.ui.activeLocalDraftId();
    if (!localId || !this.recordingSession) {
      return;
    }
    await this.persistAndSync(true);
    const draft = await this.draftStore.get(localId);
    const feature = this.recordingSession.feature;
    if (draft?.serverId) {
      feature.id = draft.serverId;
    }
    // Edit without publishing — open panel on draft feature
    this.applyFeatureToPanel(feature, false);
    this.cdr.detectChanges();
  }

  private confirmDeleteDraft(localId: string, event?: Event): void {
    const target = event?.currentTarget ?? event?.target ?? undefined;
    this.confirmationService.confirm({
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

  private async deleteDraft(localId: string): Promise<void> {
    const draft = await this.draftStore.get(localId);
    const wasActive = this.activeLocalId === localId;

    await this.draftStore.deleteLocal(localId);

    if (wasActive) {
      if (this.ui.recordModeActive()) {
        this.stopGeoWatch();
        this.ui.recordModeActive.set(false);
      }
      this.recordingSession = null;
      this.activeLocalId = null;
      this.ui.activeLocalDraftId.set(null);
      this.ui.syncStatus.set(null);
      this.ui.hasRecordingSession.set(false);
      this.syncRecordUiSignals();
      if (this.layers) {
        this.layers.setPaths(emptyFeatureCollection());
      }
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
        this.messageService.add({
          severity: locked ? 'warn' : 'warn',
          summary: this.transloco.translate(
            marker('rockExplorer.deleteServerRemains'),
          ),
        });
      }
    }

    this.cdr.detectChanges();
  }

  private exitRecordMode(): void {
    if (!this.ui.recordModeActive()) {
      return;
    }
    this.stopGeoWatch();
    if (this.recordingSession?.isRecording) {
      this.recordingSession.pause();
    }
    this.ui.recordModeActive.set(false);
    this.syncRecordUiSignals();
    void this.persistAndSync(true);
    this.cdr.detectChanges();
  }

  private pauseRecording(): void {
    if (!this.recordingSession || !this.ui.recordModeActive()) {
      return;
    }
    this.recordingSession.pause();
    this.syncRecordUiSignals();
    void this.persistAndSync(true);
    this.cdr.detectChanges();
  }

  private resumeRecording(): void {
    if (!this.recordingSession || !this.ui.recordModeActive()) {
      return;
    }
    this.recordingSession.resume();
    this.syncRecordUiSignals();
    this.startGeoWatch();
    this.cdr.detectChanges();
  }

  private finishRecordPath(): void {
    if (!this.recordingSession || !this.ui.recordModeActive()) {
      return;
    }
    if (!this.recordingSession.finishPath()) {
      this.messageService.add({
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
    this.cdr.detectChanges();
  }

  private newRecordPath(): void {
    if (!this.recordingSession || !this.ui.recordModeActive()) {
      return;
    }
    this.recordingSession.newPath();
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    this.startGeoWatch();
    void this.persistAndSync(true);
    this.cdr.detectChanges();
  }

  private syncRecordUiSignals(): void {
    const session = this.recordingSession;
    this.ui.hasRecordingSession.set(session != null);
    this.ui.recordingState.set(session?.recordingState ?? null);
    this.ui.recordPathVertexCount.set(
      session?.activePath?.geometry.coordinates.length ?? 0,
    );
    this.ui.activeLocalDraftId.set(this.activeLocalId);
  }

  private startGeoWatch(): void {
    if (this.geoWatchId != null) {
      return;
    }
    if (!navigator.geolocation) {
      this.onGeoPermissionDenied();
      return;
    }
    this.geoWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        this.ngZone.run(() => this.onRecordingGeoPosition(pos));
      },
      () => {
        this.ngZone.run(() => this.onGeoPermissionDenied());
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
  }

  private stopGeoWatch(): void {
    if (this.geoWatchId != null) {
      navigator.geolocation.clearWatch(this.geoWatchId);
      this.geoWatchId = null;
    }
  }

  private onGeoPermissionDenied(): void {
    this.messageService.add({
      severity: 'error',
      summary: this.transloco.translate(marker('rockExplorer.recordGeoDenied')),
    });
    this.exitRecordMode();
  }

  private onRecordingGeoPosition(pos: GeolocationPosition): void {
    if (!this.recordingSession || !this.ui.recordModeActive()) {
      return;
    }
    if (!this.recordingSession.isRecording) {
      return;
    }
    const kept = this.recordingSession.tryAppendFix({
      lng: pos.coords.longitude,
      lat: pos.coords.latitude,
      accuracyM: pos.coords.accuracy,
      altitudeM: pos.coords.altitude,
      timestampMs: pos.timestamp,
    });
    if (!kept) {
      return;
    }
    this.syncRecordUiSignals();
    this.refreshRecordingPathsOnMap();
    if (this.map) {
      this.map.easeTo({
        center: [pos.coords.longitude, pos.coords.latitude],
        duration: 300,
      });
    }
    if (this.recordingSession.shouldSyncNow()) {
      void this.persistAndSync(false);
    }
    this.cdr.detectChanges();
  }

  private refreshRecordingPathsOnMap(): void {
    if (!this.layers || !this.recordingSession) {
      return;
    }
    // Prefer recording paths while Record mode is active (don't fight misc overlays).
    if (this.ui.editingFeature() && !this.ui.recordModeActive()) {
      return;
    }
    this.layers.ensureMiscOverlayLayers();
    this.layers.setPaths({
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

  private async probeDraftStorage(): Promise<void> {
    const ok = await this.draftStore.probeOpen();
    this.ui.storageOk.set(ok);
    if (!ok) {
      this.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(
          marker('rockExplorer.storageUnavailable'),
        ),
      });
      this.cdr.detectChanges();
    }
  }

  private async flushDraftQueue(): Promise<void> {
    const preferLocalId = this.activeLocalId ?? undefined;
    try {
      if (this.recordingSession && this.activeLocalId) {
        await this.persistAndSync(true);
        return;
      }
      this.ui.syncStatus.set('syncing');
      await this.draftSync.flush({ preferLocalId });
      if (this.activeLocalId) {
        await this.refreshSyncStatusFromDraft(this.activeLocalId);
      } else {
        this.ui.syncStatus.set(null);
      }
    } catch {
      this.ui.syncStatus.set('error');
    }
    this.cdr.detectChanges();
  }

  private async onSyncNow(): Promise<void> {
    if (!this.ui.storageOk()) {
      return;
    }
    if (this.recordingSession && this.activeLocalId) {
      await this.persistAndSync(true);
      return;
    }
    this.ui.syncStatus.set('syncing');
    try {
      await this.draftSync.flush();
      this.ui.syncStatus.set(null);
    } catch {
      this.ui.syncStatus.set('error');
    }
    this.cdr.detectChanges();
  }

  /**
   * Persist session to IndexedDB, enqueue upsert, flush when online (or force).
   * Never skips IDB write when offline — only skips HTTP flush.
   */
  private async persistAndSync(force: boolean): Promise<void> {
    const session = this.recordingSession;
    const localId = this.activeLocalId;
    if (!session || !localId) {
      return;
    }
    if (this.persistInFlight) {
      return;
    }
    if (!force && !session.shouldSyncNow()) {
      return;
    }

    this.persistInFlight = true;
    try {
      await this.draftStore.putSnapshot(localId, session);
      await this.draftSync.enqueueUpsert(localId);
      this.ui.syncStatus.set('pending');

      if (force || this.draftSync.isOnline()) {
        this.ui.syncStatus.set('syncing');
        await this.draftSync.flush({ preferLocalId: localId });
        await this.refreshSyncStatusFromDraft(localId);
        const draft = await this.draftStore.get(localId);
        if (draft?.serverId) {
          session.feature.id = draft.serverId;
        }
        if (draft?.syncStatus === 'synced') {
          session.markSynced();
        }
      }
    } catch {
      this.ui.syncStatus.set('error');
      if (localId) {
        await this.draftStore.patch(localId, { syncStatus: 'error' });
      }
    } finally {
      this.persistInFlight = false;
      this.cdr.detectChanges();
    }
  }

  private async refreshSyncStatusFromDraft(localId: string): Promise<void> {
    const draft = await this.draftStore.get(localId);
    this.ui.syncStatus.set(draft?.syncStatus ?? null);
  }

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
    this.ui.syncStatus.set('error');
    this.syncRecordUiSignals();
    this.deviceLockLocalId = event.localId;
    this.deviceLockServerId = event.serverId;
    this.deviceLockDialogVisible = true;
    this.cdr.detectChanges();
  }

  public cancelDeviceLockDialog(): void {
    this.deviceLockDialogVisible = false;
    this.deviceLockLocalId = null;
    this.deviceLockServerId = null;
    this.cdr.detectChanges();
  }

  public async confirmDeviceLockClone(): Promise<void> {
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
      this.ui.activeLocalDraftId.set(newLocalId);
      this.ui.syncStatus.set('synced');
      this.ui.hasRecordingSession.set(true);
      this.syncRecordUiSignals();
      this.refreshRecordingPathsOnMap();
      this.deviceLockDialogVisible = false;
      this.deviceLockLocalId = null;
      this.deviceLockServerId = null;
    } catch {
      this.messageService.add({
        severity: 'error',
        summary: this.transloco.translate(marker('rockExplorer.loadError')),
      });
      this.ui.syncStatus.set('error');
    } finally {
      this.deviceLockCloneInFlight = false;
      this.cdr.detectChanges();
    }
  }
}
