import { ChangeDetectorRef, DestroyRef, NgZone } from '@angular/core';
import {
  Map as MaplibreMap,
  MapLayerMouseEvent,
  MapMouseEvent,
} from 'maplibre-gl';
import { Feature, FeatureCollection, Geometry, Position } from 'geojson';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import {
  RockExplorerParkingSite,
  RockExplorerPath,
} from '../../../models/rock-explorer-misc';
import {
  RockExplorerDrawMode,
  RockExplorerUiService,
} from '../rock-explorer-ui.service';
import { geometryFromOverlayPoints } from '../../../utility/geo/convex-hull';
import { startDocumentDrag } from '../../../utility/map/document-drag';
import {
  fitMapToGeometry,
  fitMapToPositions as fitMapPositions,
} from '../../../utility/map/map-bounds';
import { RockExplorerImageLocations } from './rock-explorer-image-locations';
import {
  buildDraftGeometryPreview,
  buildPolygonDraftCollection,
  closedPolygonRing,
  polygonRingSelfIntersects,
} from './polygon-draft';
import { RockExplorerMapLayers } from './rock-explorer-map-layers';

/** When set with point/polygon draw mode, finishing saves onto this feature instead of creating. */
type GeometryRedrawMode = 'point' | 'polygon' | null;

/** Minimal shape of the panel gallery tab needed to drive image coordinate picking. */
type MapInteractionGalleryHandle = {
  cancelMapPick(): void;
  applyMapPick(lat: number, lng: number): boolean | void;
};

/** Minimal shape of the panel misc tab (parking/paths) needed by map interaction. */
type MapInteractionMiscHandle = {
  parkingSites: RockExplorerParkingSite[];
  paths: RockExplorerPath[];
  pathDraftVertices: Position[];
  selectedPathVertexIndex: number | null;
  cancelMapPick(): void;
  cancelPathDraw(): void;
  applyMapPick(lat: number, lng: number): void;
  applyPathVertex(lng: number, lat: number): void;
  getParkingMapFeatures(): Feature[];
  getPathMapFeatures(): Feature[];
  getPathDraftCollection(): FeatureCollection<Geometry>;
  moveParkingSite(id: string, lat: number, lng: number, silent?: boolean): void;
  onParkingFieldChange(): void;
};

export type RockExplorerMapInteractionHost = {
  map: MaplibreMap | undefined;
  layers: RockExplorerMapLayers | undefined;
  ui: RockExplorerUiService;
  cdr: ChangeDetectorRef;
  destroyRef: DestroyRef;
  ngZone: NgZone;
  /** Gallery / draft / live-record image GPS dots on the map. */
  images: RockExplorerImageLocations;
  getMiscEditMode: () => boolean;
  setMiscEditMode: (active: boolean) => void;
  getDraftGeometry: () => Geometry | null;
  setDraftGeometry: (geometry: Geometry | null) => void;
  getPanelMisc: () => MapInteractionMiscHandle | null | undefined;
  getPanelGallery: () => MapInteractionGalleryHandle | null | undefined;
  /** Open the panel's blank "create feature" form (used after point/polygon finish). */
  showCreateForm: () => void;
  openEditPanel: (id: string, options?: { focus?: boolean }) => void;
  continueDraft: (localId: string) => void;
  closePanel: () => void;
  syncFeatureUrl: (featureId: string | null) => void;
  /**
   * Persist `geometry` onto `feature` (update request + toasts + feature reload +
   * panel refresh). Resolves true on success so the caller can reset draw state.
   */
  persistFeatureGeometry: (
    feature: RockExplorerFeature,
    geometry: Geometry,
  ) => Promise<boolean>;
};

/**
 * Owns draw/drag/click/geometry-edit map interaction for the rock-explorer map:
 * point & polygon drafting, vertex/parking dragging, feature select clicks,
 * geometry redraw-from-overlays, and the parking/path/image coordinate-pick
 * overlays. Mutates {@link RockExplorerMapLayers} draft/misc layers directly,
 * delegating feature CRUD and panel/router concerns back to the host.
 */
export class RockExplorerMapInteraction {
  /** In-progress point/polygon draft vertices (lng/lat pairs). */
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
  /**
   * True for the rest of a map click after an image/parking coordinate pick is
   * handled. Prevents a second layer handler (point + polygon under the same
   * click) from opening a feature once pick mode has already ended.
   */
  private consumingImageMapPick = false;
  private consumingParkingMapPick = false;

  constructor(private readonly host: RockExplorerMapInteractionHost) {}

  /** True while dragging a draft polygon/path vertex (used by image-locations host). */
  get isDraggingVertex(): boolean {
    return this.draggingVertexIndex != null;
  }

  /** True while dragging a parking marker (used by map cursor handlers). */
  get isDraggingParking(): boolean {
    return this.draggingParkingId != null;
  }

  /**
   * Re-push in-progress draft/path/misc overlays after MapLibre recreates
   * sources (e.g. base style switch). Call after {@link RockExplorerMapLayers}
   * has been rebound.
   */
  reattachAfterStyleReload(): void {
    this.refreshMiscOverlays();
    if (this.host.ui.drawingPath()) {
      this.syncPathDraftLayer();
      return;
    }
    if (this.host.ui.isPolygonToolActive() && this.polygonVertices.length > 0) {
      this.renderPolygonDraft();
      return;
    }
    const draft = this.host.getDraftGeometry();
    if (draft) {
      this.renderDraftGeometry(draft);
    }
  }

  get isCoordinatePickActive(): boolean {
    return (
      this.host.ui.pickingImageCoordinates() ||
      this.host.ui.pickingParkingCoordinates()
    );
  }

  /** True when image/parking pick or path draw is active (used by image-locations host). */
  get isMapOverlayInteractionActive(): boolean {
    return this.isCoordinatePickActive || this.host.ui.drawingPath();
  }

  // ---------------------------------------------------------------------
  // Draw / geometry edit
  // ---------------------------------------------------------------------

  public setRockExplorerDrawMode(mode: RockExplorerDrawMode): void {
    if (this.host.ui.recordModeActive()) {
      return;
    }
    this.endVertexDrag();
    this.cancelImageCoordinatePick();
    this.host.ui.drawMode.set(mode);
    this.polygonVertices = [];
    this.syncPolygonVertexCount();
    this.setGeometryEditFeature(null);
    this.geometryRedrawMode = null;
    this.clearDraftLayer();
    if (mode === 'point' || mode === 'polygon') {
      this.host.ui.showFilters.set(false);
      this.host.closePanel();
    }
    this.host.cdr.detectChanges();
  }

  public undoPolygonVertex(): void {
    if (
      this.host.ui.drawMode() !== 'polygon' ||
      this.polygonVertices.length === 0
    ) {
      return;
    }
    this.polygonVertices.pop();
    this.syncPolygonVertexCount();
    this.renderPolygonDraft();
  }

  public cancelPolygonDraw(): void {
    const resumeFeatureId = this.geometryEditFeature?.id ?? null;
    this.endVertexDrag();
    this.polygonVertices = [];
    this.clearDraftLayer();
    this.setGeometryEditFeature(null);
    this.geometryRedrawMode = null;
    this.host.ui.drawMode.set('select');
    this.syncPolygonVertexCount();
    if (resumeFeatureId) {
      this.host.openEditPanel(resumeFeatureId);
    }
    this.host.cdr.detectChanges();
  }

  public cancelPointDraw(): void {
    const resumeFeatureId = this.geometryEditFeature?.id ?? null;
    this.setGeometryEditFeature(null);
    this.geometryRedrawMode = null;
    this.host.ui.drawMode.set('select');
    this.clearDraftLayer();
    if (resumeFeatureId) {
      this.host.openEditPanel(resumeFeatureId);
    } else {
      this.host.cdr.detectChanges();
    }
  }

  public startPolygonEdit(): void {
    const feature = this.host.ui.editingFeature();
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
    this.host.ui.drawMode.set('editPolygon');
    this.host.ui.panelOpen.set(false);
    this.host.ui.featureFormActive.set(false);
    this.syncPolygonVertexCount();
    this.renderPolygonDraft();
    this.focusActiveFeature();
    this.host.cdr.detectChanges();
  }

  /** Start redrawing the current feature as a point. */
  public startRedrawAsPoint(): void {
    if (!this.beginGeometryRedraw()) {
      return;
    }
    this.geometryRedrawMode = 'point';
    this.host.ui.drawMode.set('point');
    this.polygonVertices = [];
    this.syncPolygonVertexCount();
    this.clearDraftLayer();
    if (this.host.map) {
      this.host.map.getCanvas().style.cursor = 'crosshair';
    }
    this.host.cdr.detectChanges();
  }

  /** Start redrawing the current feature as a polygon. */
  public startRedrawAsPolygon(): void {
    if (!this.beginGeometryRedraw()) {
      return;
    }
    this.geometryRedrawMode = 'polygon';
    this.host.ui.drawMode.set('polygon');
    this.polygonVertices = [];
    this.syncPolygonVertexCount();
    this.clearDraftLayer();
    if (this.host.map) {
      this.host.map.getCanvas().style.cursor = 'crosshair';
    }
    this.host.cdr.detectChanges();
  }

  /** Redraw the current feature from the overlay points (image GPS + parking + path vertices). */
  public redrawGeometryFromOverlays(): void {
    const feature = this.host.ui.editingFeature();
    if (!feature?.id || this.host.ui.saving()) {
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

  public finishPolygon(): void {
    if (
      this.host.ui.drawMode() === 'editPolygon' ||
      this.geometryRedrawMode === 'polygon'
    ) {
      this.finishPolygonEdit();
      return;
    }
    if (
      this.host.ui.drawMode() !== 'polygon' ||
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
    this.host.ui.drawMode.set('select');
  }

  /** Begin geometry redraw. */
  private beginGeometryRedraw(): boolean {
    const feature = this.host.ui.editingFeature();
    if (!feature?.id) {
      return false;
    }
    this.endVertexDrag();
    this.cancelImageCoordinatePick();
    this.cancelParkingCoordinatePick();
    this.cancelPathDraw();
    this.setGeometryEditFeature(feature);
    this.host.ui.panelOpen.set(false);
    this.host.ui.featureFormActive.set(false);
    return true;
  }

  /** Image GPS + parking + path vertices for the open feature. */
  private collectFeatureOverlayPoints(): Position[] {
    const points: Position[] = [];
    for (const feature of this.host.images.data.features) {
      if (feature.geometry?.type === 'Point') {
        points.push([
          feature.geometry.coordinates[0],
          feature.geometry.coordinates[1],
        ]);
      }
    }
    const misc = this.host.getPanelMisc();
    const parkings =
      misc?.parkingSites ?? this.host.ui.editingFeature()?.parkingSites ?? [];
    for (const site of parkings) {
      if (site.lat != null && site.lng != null) {
        points.push([site.lng, site.lat]);
      }
    }
    const paths = misc?.paths ?? this.host.ui.editingFeature()?.paths ?? [];
    for (const path of paths) {
      for (const coord of path.geometry?.coordinates ?? []) {
        if (coord.length >= 2) {
          points.push([coord[0], coord[1]]);
        }
      }
    }
    return points;
  }

  private finishPolygonEdit(): void {
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

  /**
   * Thin geometry-save wrapper — resolves the target feature and hands the
   * actual persist request to the host, then resets owned draw/edit state on
   * success (host owns the CRUD call, toasts, feature reload, panel refresh).
   */
  private saveFeatureGeometry(geometry: Geometry): void {
    const feature = this.geometryEditFeature ?? this.host.ui.editingFeature();
    if (!feature?.id || this.host.ui.saving()) {
      return;
    }
    void this.host.persistFeatureGeometry(feature, geometry).then((saved) => {
      if (!saved) {
        return;
      }
      this.endVertexDrag();
      this.polygonVertices = [];
      this.syncPolygonVertexCount();
      this.clearDraftLayer();
      this.setGeometryEditFeature(null);
      this.geometryRedrawMode = null;
      this.host.ui.drawMode.set('select');
      if (this.host.map) {
        this.host.map.getCanvas().style.cursor = '';
      }
    });
  }

  private syncPolygonVertexCount(): void {
    this.host.ui.polygonVertexCount.set(this.polygonVertices.length);
    this.host.ui.polygonSelfIntersecting.set(
      polygonRingSelfIntersects(this.polygonVertices),
    );
  }

  private setGeometryEditFeature(feature: RockExplorerFeature | null): void {
    this.geometryEditFeature = feature;
    this.host.ui.geometryEditActive.set(feature != null);
  }

  // ---------------------------------------------------------------------
  // Map click / select
  // ---------------------------------------------------------------------

  public onMapClick(event: MapMouseEvent): void {
    if (this.host.images.consumingClick) {
      return;
    }
    this.host.images.hideHover({ force: true });
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
    if (this.host.ui.drawMode() === 'point') {
      if (this.geometryRedrawMode === 'point' && this.geometryEditFeature) {
        this.host.ngZone.run(() =>
          this.saveFeatureGeometry({
            type: 'Point',
            coordinates: [event.lngLat.lng, event.lngLat.lat],
          }),
        );
        return;
      }
      this.host.ui.drawMode.set('select');
      this.openCreatePanel({
        type: 'Point',
        coordinates: [event.lngLat.lng, event.lngLat.lat],
      });
      return;
    }
    if (this.host.ui.drawMode() === 'polygon') {
      this.polygonVertices.push([event.lngLat.lng, event.lngLat.lat]);
      this.syncPolygonVertexCount();
      this.renderPolygonDraft();
    }
  }

  public onFeatureSelectClick(event: MapLayerMouseEvent): void {
    if (this.host.images.consumingClick) {
      return;
    }
    event.originalEvent.stopPropagation();
    if (this.applyMapOverlayPick(event.lngLat.lat, event.lngLat.lng)) {
      return;
    }
    const id = event.features?.[0]?.properties?.['id'];
    if (!id || this.host.ui.drawMode() !== 'select') {
      return;
    }
    this.host.openEditPanel(String(id), { focus: true });
  }

  /** Click a grey local-draft polygon → reopen Record toolbar + show paths. */
  public onLocalDraftClick(event: MapLayerMouseEvent): void {
    if (this.host.images.consumingClick) {
      return;
    }
    event.originalEvent.stopPropagation();
    if (this.host.ui.isDrawToolActive() || this.host.ui.recordModeActive()) {
      return;
    }
    if (this.host.ui.drawMode() !== 'select') {
      return;
    }
    const localId = event.features?.[0]?.properties?.['localId'];
    if (typeof localId !== 'string' || !localId) {
      return;
    }
    this.host.continueDraft(localId);
  }

  private openCreatePanel(geometry: Geometry): void {
    this.closeSessionsPanelIfOpen();
    this.host.ui.featureFormActive.set(true);
    this.host.ui.editingFeature.set(null);
    this.host.setDraftGeometry(geometry);
    this.host.images.clearFeature();
    this.clearMiscOverlays();
    this.host.ui.panelOpen.set(true);
    this.renderDraftGeometry(geometry);
    this.applySelectionFilters();
    this.host.syncFeatureUrl(null);
    this.host.cdr.detectChanges();
    queueMicrotask(() => this.host.showCreateForm());
  }

  // ---------------------------------------------------------------------
  // Focus helpers
  // ---------------------------------------------------------------------

  public focusActiveFeature(): void {
    const geometry =
      this.host.ui.editingFeature()?.geometry ??
      this.host.getDraftGeometry() ??
      null;
    if (!this.host.map || !geometry) {
      return;
    }
    const padding = this.host.ui.isMobileViewport()
      ? { top: 64, bottom: 320, left: 48, right: 48 }
      : { top: 64, bottom: 64, left: 48, right: 380 };
    fitMapToGeometry(this.host.map, geometry, {
      padding,
      maxZoom: geometry.type === 'Point' ? 17 : 18,
      duration: 700,
    });
  }

  /** Fit the map to path/polygon draft vertices (used when starting path edit). */
  public fitMapToPositions(positions: Position[]): void {
    if (!this.host.map || positions.length === 0) {
      return;
    }
    // Panel is hidden during path edit — keep padding balanced.
    const padding = this.host.ui.isMobileViewport()
      ? { top: 64, bottom: 120, left: 48, right: 48 }
      : { top: 64, bottom: 64, left: 48, right: 48 };
    fitMapPositions(this.host.map, positions, {
      padding,
      maxZoom: positions.length === 1 ? 17 : 18,
      duration: 700,
    });
  }

  // ---------------------------------------------------------------------
  // Drag (draft vertices + parking markers)
  // ---------------------------------------------------------------------

  public canDragParkingMarkers(): boolean {
    return (
      this.host.getMiscEditMode() &&
      !this.host.ui.pickingParkingCoordinates() &&
      !this.host.ui.drawingPath() &&
      !this.host.ui.isPolygonToolActive()
    );
  }

  public onParkingMarkerMouseDown(event: MapLayerMouseEvent): void {
    const misc = this.host.getPanelMisc();
    if (!this.canDragParkingMarkers() || !this.host.map || !misc) {
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
      features: misc.getParkingMapFeatures(),
    };
    this.host.map.dragPan.disable();
    this.host.map.getCanvas().style.cursor = 'grabbing';
    this.startDocumentDragListeners();
  }

  public onDraftVertexMouseDown(event: MapLayerMouseEvent): void {
    if (
      (!this.host.ui.isPolygonToolActive() && !this.host.ui.drawingPath()) ||
      !this.host.map
    ) {
      return;
    }
    const feature = event.features?.[0];
    const index = Number(feature?.properties?.['vertexIndex']);
    const vertexCount = this.host.ui.drawingPath()
      ? (this.host.getPanelMisc()?.pathDraftVertices.length ?? 0)
      : this.polygonVertices.length;
    if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
      return;
    }
    event.preventDefault();
    this.draggingVertexIndex = index;
    this.vertexDragMoved = false;
    this.suppressNextMapClick = true;
    this.dragOverlayCollection = this.host.ui.drawingPath()
      ? (this.host.getPanelMisc()?.getPathDraftCollection() ?? null)
      : buildPolygonDraftCollection(this.polygonVertices);
    this.host.map.dragPan.disable();
    this.host.map.getCanvas().style.cursor = 'grabbing';
    this.startDocumentDragListeners();
  }

  public cancelDragListeners(): void {
    this.cancelDrag?.();
    this.cancelDrag = null;
  }

  /**
   * Document-level listeners registered outside NgZone — MapLibre canvas
   * listeners alone are not enough if the map was ever touched by Zone.js.
   */
  private startDocumentDragListeners(): void {
    this.cancelDragListeners();
    this.host.ngZone.runOutsideAngular(() => {
      this.cancelDrag = startDocumentDrag({
        onMove: (event) => this.onDocumentDragMove(event),
        onUp: () => this.endMapDrag(),
      });
    });
  }

  private onDocumentDragMove(event: MouseEvent): void {
    if (
      !this.host.map ||
      (this.draggingParkingId == null && this.draggingVertexIndex == null)
    ) {
      return;
    }
    const rect = this.host.map.getCanvas().getBoundingClientRect();
    const lngLat = this.host.map.unproject([
      event.clientX - rect.left,
      event.clientY - rect.top,
    ]);
    this.applyDragLngLat(lngLat.lng, lngLat.lat);
  }

  private applyDragLngLat(lng: number, lat: number): void {
    if (this.draggingParkingId) {
      this.host
        .getPanelMisc()
        ?.moveParkingSite(this.draggingParkingId, lat, lng, true);
      if (this.dragOverlayCollection) {
        this.syncParkingDragCollectionCoords();
        this.host.layers?.setParking(this.dragOverlayCollection);
      }
      return;
    }
    if (this.draggingVertexIndex == null) {
      return;
    }
    this.vertexDragMoved = true;
    if (this.host.ui.drawingPath()) {
      const verts = this.host.getPanelMisc()?.pathDraftVertices;
      if (
        verts &&
        this.draggingVertexIndex >= 0 &&
        this.draggingVertexIndex < verts.length
      ) {
        verts[this.draggingVertexIndex][0] = lng;
        verts[this.draggingVertexIndex][1] = lat;
      }
      if (this.dragOverlayCollection) {
        this.host.layers?.setDraft(this.dragOverlayCollection);
      }
      return;
    }
    this.polygonVertices[this.draggingVertexIndex][0] = lng;
    this.polygonVertices[this.draggingVertexIndex][1] = lat;
    this.dragOverlayCollection = buildPolygonDraftCollection(
      this.polygonVertices,
    );
    this.host.layers?.setDraft(this.dragOverlayCollection);
    this.host.ui.polygonSelfIntersecting.set(
      polygonRingSelfIntersects(this.polygonVertices),
    );
  }

  /** Parking features are rebuilt as new objects; refresh coords from model. */
  private syncParkingDragCollectionCoords(): void {
    const misc = this.host.getPanelMisc();
    if (!this.dragOverlayCollection || !misc) {
      return;
    }
    for (const feature of this.dragOverlayCollection.features) {
      if (feature.geometry.type !== 'Point') {
        continue;
      }
      const id = String(feature.properties?.['id'] ?? '');
      const site = misc.parkingSites.find((s) => s.id === id);
      if (site?.lng != null && site?.lat != null) {
        feature.geometry.coordinates[0] = site.lng;
        feature.geometry.coordinates[1] = site.lat;
      }
    }
  }

  private endMapDrag(): void {
    this.cancelDragListeners();
    this.dragOverlayCollection = null;

    if (this.draggingParkingId) {
      this.draggingParkingId = null;
      this.host.map?.dragPan.enable();
      if (this.host.map && !this.isMapOverlayInteractionActive) {
        this.host.map.getCanvas().style.cursor = '';
      }
      this.host.ngZone.run(() => {
        this.host.getPanelMisc()?.onParkingFieldChange();
        this.host.cdr.detectChanges();
      });
      return;
    }
    this.endVertexDrag();
  }

  private endVertexDrag(): void {
    if (this.draggingVertexIndex == null) {
      return;
    }
    const index = this.draggingVertexIndex;
    const wasClick = !this.vertexDragMoved;
    this.draggingVertexIndex = null;
    this.vertexDragMoved = false;
    this.dragOverlayCollection = null;
    this.cancelDragListeners();
    this.host.map?.dragPan.enable();
    if (this.host.map) {
      this.host.map.getCanvas().style.cursor =
        this.host.ui.isPolygonToolActive() || this.host.ui.drawingPath()
          ? 'grab'
          : '';
    }
    const misc = this.host.getPanelMisc();
    if (!this.host.ui.drawingPath() || !misc) {
      return;
    }
    const nextSelected = wasClick ? index : null;
    const selectionChanged = misc.selectedPathVertexIndex !== nextSelected;
    misc.selectedPathVertexIndex = nextSelected;
    this.host.ui.selectedPathVertexIndex.set(nextSelected);
    if (selectionChanged) {
      this.syncPathDraftLayer();
      this.host.ngZone.run(() => this.host.cdr.detectChanges());
    }
  }

  // ---------------------------------------------------------------------
  // Misc overlays (parking / path / image coordinate pick)
  // ---------------------------------------------------------------------

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
    this.host.setMiscEditMode(editMode);
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
    if (active && this.host.ui.recordModeActive()) {
      return;
    }
    if (active) {
      this.cancelImageCoordinatePick();
      this.cancelParkingCoordinatePick();
      if (this.host.ui.drawMode() !== 'select') {
        this.setRockExplorerDrawMode('select');
      }
      this.host.map?.doubleClickZoom.disable();
    } else {
      this.host.map?.doubleClickZoom.enable();
    }
    this.host.ui.drawingPath.set(active);
    this.updateMapPickPanelVisibility();
    if (
      this.host.map &&
      this.draggingVertexIndex == null &&
      !this.host.ui.isPolygonToolActive()
    ) {
      this.host.map.getCanvas().style.cursor = active ? 'crosshair' : '';
    }
    this.syncPathDraftStateFromMisc();
    this.refreshMiscOverlays();
    if (active) {
      this.fitMapToPositions(this.host.getPanelMisc()?.pathDraftVertices ?? []);
    }
    this.host.cdr.detectChanges();
  }

  public onPathDraftChange(): void {
    this.syncPathDraftLayer();
  }

  public onMiscPreviewChange(): void {
    this.refreshMiscOverlays();
    this.host.cdr.detectChanges();
  }

  public onMiscSaved(feature: RockExplorerFeature): void {
    const editing = this.host.ui.editingFeature();
    if (editing && feature.id === editing.id) {
      editing.parkingSites = feature.parkingSites;
      editing.paths = feature.paths;
    }
    this.refreshMiscOverlays();
  }

  public cancelParkingCoordinatePick(): void {
    this.host.getPanelMisc()?.cancelMapPick();
    this.setParkingCoordinatePickActive(false);
  }

  public cancelPathDraw(): void {
    this.host.getPanelMisc()?.cancelPathDraw();
    this.host.ui.drawingPath.set(false);
    this.host.ui.pathDraftVertexCount.set(0);
    this.host.ui.selectedPathVertexIndex.set(null);
    this.host.map?.doubleClickZoom.enable();
    this.updateMapPickPanelVisibility();
    if (
      this.host.map &&
      this.draggingVertexIndex == null &&
      !this.host.ui.isPolygonToolActive()
    ) {
      this.host.map.getCanvas().style.cursor = this.isCoordinatePickActive
        ? 'crosshair'
        : '';
    }
  }

  public cancelImageCoordinatePick(): void {
    this.host.getPanelGallery()?.cancelMapPick();
    this.setImageCoordinatePickActive(false);
  }

  private setImageCoordinatePickActive(active: boolean): void {
    if (active) {
      this.host.images.hideHover({ force: true });
    }
    this.host.ui.pickingImageCoordinates.set(active);
    this.updateMapPickPanelVisibility();
    if (
      this.host.map &&
      this.draggingVertexIndex == null &&
      !this.host.ui.isPolygonToolActive()
    ) {
      this.host.map.getCanvas().style.cursor = this
        .isMapOverlayInteractionActive
        ? 'crosshair'
        : '';
    }
    this.host.cdr.detectChanges();
  }

  private setParkingCoordinatePickActive(active: boolean): void {
    if (active) {
      this.host.images.hideHover({ force: true });
    }
    this.host.ui.pickingParkingCoordinates.set(active);
    this.updateMapPickPanelVisibility();
    if (
      this.host.map &&
      this.draggingVertexIndex == null &&
      !this.host.ui.isPolygonToolActive()
    ) {
      this.host.map.getCanvas().style.cursor = this
        .isMapOverlayInteractionActive
        ? 'crosshair'
        : '';
    }
    this.host.cdr.detectChanges();
  }

  private updateMapPickPanelVisibility(): void {
    this.host.ui.mapPickHidesPanel.set(
      this.host.ui.drawingPath() ||
        (this.isCoordinatePickActive && this.host.ui.isMobileViewport()),
    );
  }

  private applyImageCoordinatePick(lat: number, lng: number): boolean {
    if (
      !this.host.ui.pickingImageCoordinates() &&
      !this.consumingImageMapPick
    ) {
      return false;
    }
    if (this.host.ui.pickingImageCoordinates()) {
      this.consumingImageMapPick = true;
      this.host.getPanelGallery()?.applyMapPick(lat, lng);
      setTimeout(() => {
        this.consumingImageMapPick = false;
      }, 0);
    }
    return true;
  }

  private applyParkingCoordinatePick(lat: number, lng: number): boolean {
    if (
      !this.host.ui.pickingParkingCoordinates() &&
      !this.consumingParkingMapPick
    ) {
      return false;
    }
    if (this.host.ui.pickingParkingCoordinates()) {
      this.consumingParkingMapPick = true;
      this.host.getPanelMisc()?.applyMapPick(lat, lng);
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
    if (this.host.ui.drawingPath()) {
      this.host.getPanelMisc()?.applyPathVertex(lng, lat);
      return true;
    }
    return false;
  }

  private refreshMiscOverlaysFromFeature(feature: RockExplorerFeature): void {
    this.host.layers?.setParking({
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
    this.host.layers?.setPaths({
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
    const editing = this.host.ui.editingFeature();
    if (!editing) {
      this.clearMiscOverlays();
      return;
    }
    this.host.layers?.ensureMiscOverlayLayers();
    const misc = this.host.getPanelMisc();
    if (misc) {
      this.host.layers?.setParking({
        type: 'FeatureCollection',
        features: misc.getParkingMapFeatures(),
      });
      this.host.layers?.setPaths({
        type: 'FeatureCollection',
        features: misc.getPathMapFeatures(),
      });
      if (this.host.ui.drawingPath()) {
        this.syncPathDraftLayer();
      } else if (!this.host.ui.isPolygonToolActive()) {
        // Path edit finished/cancelled — don't leave draft vertices (e.g. red selected).
        this.host.ui.pathDraftVertexCount.set(0);
        this.host.ui.selectedPathVertexIndex.set(null);
        this.clearDraftLayer();
      }
    } else {
      this.refreshMiscOverlaysFromFeature(editing);
    }
  }

  private syncPathDraftStateFromMisc(): void {
    const misc = this.host.getPanelMisc();
    this.host.ui.pathDraftVertexCount.set(misc?.pathDraftVertices.length ?? 0);
    this.host.ui.selectedPathVertexIndex.set(
      misc?.selectedPathVertexIndex ?? null,
    );
  }

  /** Update draft map layer only — mirrors polygon `renderPolygonDraft`. */
  private syncPathDraftLayer(): void {
    this.syncPathDraftStateFromMisc();
    const misc = this.host.getPanelMisc();
    if (!this.host.ui.drawingPath() || !misc) {
      if (!this.host.ui.isPolygonToolActive()) {
        this.clearDraftLayer();
      }
      return;
    }
    this.host.layers?.setDraft(misc.getPathDraftCollection());
  }

  // ---------------------------------------------------------------------
  // Small layer / panel-session helpers shared by the sections above
  // ---------------------------------------------------------------------

  private renderPolygonDraft(): void {
    this.host.layers?.setDraft(
      buildPolygonDraftCollection(this.polygonVertices),
    );
  }

  private renderDraftGeometry(geometry: Geometry): void {
    this.host.layers?.setDraft(buildDraftGeometryPreview(geometry));
  }

  private clearDraftLayer(): void {
    this.host.layers?.clearDraft();
  }

  private clearMiscOverlays(): void {
    this.host.layers?.clearMiscOverlays(this.host.ui.isPolygonToolActive());
  }

  private applySelectionFilters(): void {
    const id = this.host.ui.editingFeature()?.id;
    this.host.layers?.applySelectionFilters(id ? [id] : []);
  }

  /** Feature panel and sessions panel are mutually exclusive. */
  private closeSessionsPanelIfOpen(): void {
    if (this.host.ui.sessionsPanelOpen()) {
      this.host.ui.sessionsPanelOpen.set(false);
    }
  }
}
