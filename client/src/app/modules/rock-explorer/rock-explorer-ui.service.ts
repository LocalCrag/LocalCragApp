import { Injectable, computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { RockExplorerFeature } from '../../models/rock-explorer-feature';
import { Coordinates } from '../../interfaces/coordinates.interface';
import { Position } from 'geojson';
import { POTENTIAL_FILL_COLORS } from './map/rock-explorer-map.constants';
import { RecordingState } from './rock-explorer-recording';
import type { DraftSyncStatus } from './offline/rock-explorer-draft.types';

export type RockExplorerSelectOption = { label: string; value: string };

/** Base-map row shown in the Rock Explorer style toggle. */
export type MapBaseLayerInfo = {
  id: string;
  name: string;
};

/** Overlay row shown in the Rock Explorer layers panel (session UI). */
export type RockExplorerCustomMapLayerInfo = {
  id: string;
  name: string;
  /** Instance-settings default; used when seeding session opacities. */
  defaultOpacity: number;
  /** Vector overlays: expandable source-layer toggles. */
  subLayers?: RockExplorerCustomMapSubLayerInfo[];
};

export type RockExplorerCustomMapSubLayerInfo = {
  /** Visibility key: `${parentId}--${index}`. */
  id: string;
  name: string;
  index: number;
  /** Solid fill, or categorical fallback color from instance settings. */
  color: string;
  paintMode?: 'solid' | 'categorical';
  categoricalProperty?: string;
  categoricalStops?: { value: string; color: string }[];
  /** Applied only the first time the parent overlay is turned on this session. */
  defaultActive: boolean;
};

export type RockExplorerDrawMode =
  'select' | 'point' | 'polygon' | 'editPolygon';

export type RockExplorerFilters = {
  potential?: string;
  rockQuality?: string;
  rockType?: string;
};

/** UI / map-host commands. The map host is the sole subscriber. */
export type RockExplorerCommand =
  | { type: 'setDrawMode'; mode: RockExplorerDrawMode }
  | { type: 'cancelPointDraw' }
  | { type: 'undoPolygonVertex' }
  | { type: 'finishPolygon' }
  | { type: 'cancelPolygonDraw' }
  | { type: 'switchMapStyle'; styleId: string }
  | { type: 'toggleCustomMapLayers' }
  | { type: 'setCustomMapLayerOpacity'; layerId: string; opacity: number }
  | { type: 'setCustomMapLayerVisible'; layerId: string; visible: boolean }
  | { type: 'moveCustomMapLayer'; layerId: string; direction: 'up' | 'down' }
  | { type: 'filtersChange'; filters: RockExplorerFilters }
  | { type: 'cancelImageCoordinatePick' }
  | { type: 'cancelParkingCoordinatePick' }
  | { type: 'cancelPathDraw' }
  | { type: 'deletePathVertex' }
  | { type: 'finishPathDraw' }
  | { type: 'closePanel' }
  | { type: 'focusOnMap' }
  | { type: 'shareFeature' }
  | { type: 'editGeometry' }
  | { type: 'redrawAsPoint' }
  | { type: 'redrawAsPolygon' }
  | { type: 'redrawFromContent' }
  | { type: 'deleteRequest'; event: Event }
  | { type: 'saveFeature'; feature: RockExplorerFeature }
  | { type: 'imagesChanged' }
  | { type: 'imageEditModeChange'; editMode: boolean }
  | { type: 'imageMapPickChange'; active: boolean }
  | { type: 'coordinatesPreviewChange' }
  | { type: 'imagesLoaded' }
  | { type: 'focusCoordinates'; coordinates: Coordinates }
  | { type: 'miscEditModeChange'; editMode: boolean }
  | { type: 'parkingMapPickChange'; active: boolean }
  | { type: 'pathDrawChange'; active: boolean }
  | { type: 'pathDraftChange' }
  | { type: 'miscPreviewChange' }
  | { type: 'miscSaved'; feature: RockExplorerFeature }
  | { type: 'focusPathGeometry'; positions: Position[] }
  | { type: 'enterRecord' }
  | { type: 'exitRecord' }
  | { type: 'pauseRecording' }
  | { type: 'resumeRecording' }
  | { type: 'finishRecordPath' }
  | { type: 'newRecordPath' }
  | { type: 'syncNow' }
  | { type: 'openSessionsPanel' }
  | { type: 'closeSessionsPanel' }
  | { type: 'continueDraft'; localId: string }
  | { type: 'publishDraft'; localId?: string }
  | { type: 'showDraftOnMap'; localId: string }
  | { type: 'addRecordImage' }
  | { type: 'editRecordInfo' }
  | { type: 'deleteDraft'; localId: string; event?: Event };

/**
 * Session state + command bus for rock explorer.
 * Provide on `RockExplorerComponent` so each visit gets a fresh instance.
 */
@Injectable()
export class RockExplorerUiService {
  // --- Panel / feature session ---
  readonly saving = signal(false);
  readonly featureFormActive = signal(false);
  readonly mapPickHidesPanel = signal(false);
  readonly editingFeature = signal<RockExplorerFeature | null>(null);
  readonly panelOpen = signal(false);

  readonly potentialOptions = signal<RockExplorerSelectOption[]>([]);
  readonly rockQualityOptions = signal<RockExplorerSelectOption[]>([]);
  readonly rockTypeOptions = signal<RockExplorerSelectOption[]>([]);

  // --- Map chrome / draw tools ---
  readonly drawMode = signal<RockExplorerDrawMode>('select');
  readonly polygonVertexCount = signal(0);
  /** True while the polygon draft ring has crossing edges. */
  readonly polygonSelfIntersecting = signal(false);
  readonly geometryEditActive = signal(false);
  /** Selected base-layer id (from instance settings / MapTiler fallback). */
  readonly mapStyle = signal<string>('');
  /** Base layers available in the style toggle. */
  readonly baseLayers = signal<MapBaseLayerInfo[]>([]);
  /** Master switch for instance-configured Rock Explorer raster overlays (session-only). */
  readonly customMapLayersVisible = signal(true);
  /** True when instance settings include at least one custom map overlay. */
  readonly hasCustomMapLayers = signal(false);
  /** Overlay metadata for the layers panel (from instance settings / session order). */
  readonly customMapLayerInfos = signal<RockExplorerCustomMapLayerInfo[]>([]);
  /**
   * Per-overlay opacity for this Rock Explorer visit (session-only).
   * Seeded from instance-settings defaults; not written back to settings.
   */
  readonly customMapLayerOpacities = signal<Record<string, number>>({});
  /**
   * Per-overlay on/off for this Rock Explorer visit (session-only).
   * Seeded from the selected base map's `defaultOverlayIds`.
   */
  readonly customMapLayerVisibility = signal<Record<string, boolean>>({});
  /**
   * Parent overlay ids that have already been activated once this session.
   * Sub-layer `defaultActive` is applied only on that first activation.
   */
  readonly activatedCustomOverlayIds = signal<ReadonlySet<string>>(new Set());
  readonly isMobileViewport = signal(false);
  readonly pickingImageCoordinates = signal(false);
  readonly pickingParkingCoordinates = signal(false);
  readonly drawingPath = signal(false);
  readonly pathDraftVertexCount = signal(0);
  readonly selectedPathVertexIndex = signal<number | null>(null);
  readonly showFilters = signal(false);

  /** True while Record mode chrome is active (exclusive vs point/polygon). */
  readonly recordModeActive = signal(false);
  /** Mirrors session recordingState for toolbar Pause/Resume. */
  readonly recordingState = signal<RecordingState | null>(null);
  /** Active open GPS path vertex count (for Finish path enablement). */
  readonly recordPathVertexCount = signal(0);
  /** True while a GPS path is open (not yet finished) — hides New Path. */
  readonly hasActiveRecordPath = signal(false);
  /** True while an in-memory draft session exists (survives exit Record). */
  readonly hasRecordingSession = signal(false);
  /** Draft sync chrome status (pending|syncing|synced|error). */
  readonly syncStatus = signal<DraftSyncStatus | null>(null);
  /** True when Publish/sync should treat the app as reachable (not just navigator.onLine). */
  readonly online = signal(true);
  /** False when IndexedDB probe/open fails — Record disabled. */
  readonly storageOk = signal(true);
  /** Active local draft id while a recording session is bound. */
  readonly activeLocalDraftId = signal<string | null>(null);
  /** Floating sessions panel open state. */
  readonly sessionsPanelOpen = signal(false);

  /** Record allowed when IndexedDB is available. */
  readonly canStartRecord = computed(() => this.storageOk());

  readonly isPolygonToolActive = computed(() => {
    const mode = this.drawMode();
    return mode === 'polygon' || mode === 'editPolygon';
  });
  readonly isDrawToolActive = computed(
    () => this.drawMode() === 'point' || this.isPolygonToolActive(),
  );
  /** Point/polygon tools available only when not in Record mode. */
  readonly canUseGeometryTools = computed(() => !this.recordModeActive());

  private readonly commandsSubject = new Subject<RockExplorerCommand>();
  readonly commands$ = this.commandsSubject.asObservable();

  potentialColor(value: string | null | undefined): string {
    if (!value) {
      return POTENTIAL_FILL_COLORS.NONE;
    }
    return POTENTIAL_FILL_COLORS[value] ?? POTENTIAL_FILL_COLORS.NONE;
  }

  dispatch(command: RockExplorerCommand): void {
    this.commandsSubject.next(command);
  }

  setFeatureFormActive(active: boolean): void {
    this.featureFormActive.set(active);
  }

  setDrawMode(mode: RockExplorerDrawMode): void {
    if (this.recordModeActive()) {
      return;
    }
    this.drawMode.set(mode);
  }

  toggleFilters(): void {
    this.showFilters.update((open) => !open);
  }

  /** Seeds the base-layer toggle from resolved instance settings. */
  initBaseLayers(layers: MapBaseLayerInfo[], selectedId: string | null): void {
    this.baseLayers.set(layers);
    this.mapStyle.set(selectedId ?? '');
  }

  /**
   * Seeds the layers panel from instance settings.
   * Existing session opacities for known ids are kept; new ids get settings defaults.
   * Array order is the paint/stack order (first = top).
   * Visibility is seeded from the selected base map's `defaultOverlayIds`.
   */
  initCustomMapLayers(
    configs: {
      id: string;
      name?: string;
      opacity: number;
      type?: string;
      layers?: {
        name?: string;
        sourceLayer?: string;
        color?: string;
        paintMode?: string;
        categoricalProperty?: string;
        categoricalStops?: { value?: string; color?: string }[];
        defaultActive?: boolean;
      }[];
    }[],
    activeOverlayIds?: string[],
  ): void {
    const list = Array.isArray(configs) ? configs : [];
    this.hasCustomMapLayers.set(list.length > 0);
    this.customMapLayerInfos.set(
      list
        .filter((c) => !!c?.id)
        .map((c) => ({
          id: c.id,
          name: (c.name && c.name.trim()) || c.id,
          defaultOpacity: clampOpacity(c.opacity),
          subLayers:
            c.type === 'vector'
              ? (c.layers ?? [])
                  .map((layer, index) => {
                    const sourceLayer = String(layer?.sourceLayer ?? '').trim();
                    if (!sourceLayer) {
                      return null;
                    }
                    const name =
                      String(layer?.name ?? '').trim() || sourceLayer;
                    const paintMode: 'solid' | 'categorical' =
                      layer?.paintMode === 'categorical'
                        ? 'categorical'
                        : 'solid';
                    const mapped: RockExplorerCustomMapSubLayerInfo = {
                      id: `${c.id}--${index}`,
                      name,
                      index,
                      color: String(layer?.color ?? '#2d6a4f'),
                      paintMode,
                      categoricalProperty: String(
                        layer?.categoricalProperty ?? '',
                      ).trim(),
                      categoricalStops: Array.isArray(layer?.categoricalStops)
                        ? layer.categoricalStops
                            .map((stop) => ({
                              value: String(stop?.value ?? '').trim(),
                              color: String(stop?.color ?? '#2d6a4f'),
                            }))
                            .filter((stop) => stop.value.length > 0)
                        : [],
                      defaultActive: layer?.defaultActive !== false,
                    };
                    return mapped;
                  })
                  .filter(
                    (layer): layer is RockExplorerCustomMapSubLayerInfo =>
                      layer != null,
                  )
              : undefined,
        })),
    );
    const nextOpacity = { ...this.customMapLayerOpacities() };
    const keep = new Set(list.map((c) => c.id));
    for (const id of Object.keys(nextOpacity)) {
      if (!keep.has(id)) {
        delete nextOpacity[id];
      }
    }
    for (const c of list) {
      if (nextOpacity[c.id] === undefined) {
        nextOpacity[c.id] = clampOpacity(c.opacity);
      }
    }
    this.customMapLayerOpacities.set(nextOpacity);
    this.activatedCustomOverlayIds.set(new Set());
    this.applyBaseLayerDefaultOverlays(activeOverlayIds);
  }

  /** Sets overlay visibility from a base map's `defaultOverlayIds`. */
  applyBaseLayerDefaultOverlays(activeOverlayIds?: string[]): void {
    const infos = this.customMapLayerInfos();
    const active = new Set(activeOverlayIds ?? []);
    const previouslyActivated = this.activatedCustomOverlayIds();
    const newlyActivated = new Set(previouslyActivated);
    const current = this.customMapLayerVisibility();
    const nextVisibility: Record<string, boolean> = {};
    for (const info of infos) {
      const parentOn = active.has(info.id);
      nextVisibility[info.id] = parentOn;
      const applyDefaults = parentOn && !previouslyActivated.has(info.id);
      for (const sub of info.subLayers ?? []) {
        if (applyDefaults) {
          nextVisibility[sub.id] = sub.defaultActive !== false;
        } else if (Object.prototype.hasOwnProperty.call(current, sub.id)) {
          nextVisibility[sub.id] = current[sub.id] !== false;
        } else {
          nextVisibility[sub.id] = sub.defaultActive !== false;
        }
      }
      if (parentOn) {
        newlyActivated.add(info.id);
      }
    }
    this.customMapLayerVisibility.set(nextVisibility);
    this.activatedCustomOverlayIds.set(newlyActivated);
  }

  setCustomMapLayerOpacity(layerId: string, opacity: number): void {
    this.customMapLayerOpacities.update((current) => ({
      ...current,
      [layerId]: clampOpacity(opacity),
    }));
  }

  setCustomMapLayerVisible(layerId: string, visible: boolean): void {
    const parent = this.customMapLayerInfos().find(
      (layer) => layer.id === layerId,
    );
    this.customMapLayerVisibility.update((current) => {
      const next = { ...current, [layerId]: visible };
      if (parent && visible && !this.activatedCustomOverlayIds().has(layerId)) {
        for (const sub of parent.subLayers ?? []) {
          next[sub.id] = sub.defaultActive !== false;
        }
      }
      return next;
    });
    if (parent && visible) {
      this.activatedCustomOverlayIds.update((current) => {
        if (current.has(layerId)) {
          return current;
        }
        const next = new Set(current);
        next.add(layerId);
        return next;
      });
    }
  }

  /**
   * Reorders session overlay list. `up` moves earlier in the list (toward the
   * top of the stack); `down` moves later (toward the basemap / bottom).
   * Returns the new ordered ids, or null if no change.
   */
  moveCustomMapLayer(
    layerId: string,
    direction: 'up' | 'down',
  ): string[] | null {
    const list = [...this.customMapLayerInfos()];
    const index = list.findIndex((layer) => layer.id === layerId);
    if (index < 0) {
      return null;
    }
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) {
      return null;
    }
    const [item] = list.splice(index, 1);
    list.splice(target, 0, item);
    this.customMapLayerInfos.set(list);
    return list.map((layer) => layer.id);
  }

  resetPanelSession(): void {
    this.featureFormActive.set(false);
    this.mapPickHidesPanel.set(false);
    this.editingFeature.set(null);
    this.panelOpen.set(false);
  }
}

function clampOpacity(opacity: number): number {
  if (!Number.isFinite(opacity)) {
    return 0.5;
  }
  return Math.min(1, Math.max(0, opacity));
}
