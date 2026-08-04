import { Injectable, computed, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { MapStyles } from '../../enums/map-styles';
import { RockExplorerFeature } from '../../models/rock-explorer-feature';
import { Coordinates } from '../../interfaces/coordinates.interface';
import { Position } from 'geojson';
import { POTENTIAL_FILL_COLORS } from './map/rock-explorer-map.constants';
import { RecordingState } from './rock-explorer-recording';
import type { DraftSyncStatus } from './offline/rock-explorer-draft.types';

export type RockExplorerSelectOption = { label: string; value: string };

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
  | { type: 'switchMapStyle'; style: MapStyles }
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
  | { type: 'syncNow' };

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
  readonly mapStyle = signal<MapStyles>(MapStyles.TOPO);
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
  /** True while an in-memory draft session exists (survives exit Record). */
  readonly hasRecordingSession = signal(false);
  /** Draft sync chrome status (pending|syncing|synced|error). */
  readonly syncStatus = signal<DraftSyncStatus | null>(null);
  /** False when IndexedDB probe/open fails (D-19) — Record disabled. */
  readonly storageOk = signal(true);
  /** Active local draft id while a recording session is bound. */
  readonly activeLocalDraftId = signal<string | null>(null);
  /** Stub for plan 03 sessions panel; default closed. */
  readonly sessionsPanelOpen = signal(false);

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

  resetPanelSession(): void {
    this.featureFormActive.set(false);
    this.mapPickHidesPanel.set(false);
    this.editingFeature.set(null);
    this.panelOpen.set(false);
  }
}
