import { Position } from 'geojson';
import { RockExplorerFeature } from '../../models/rock-explorer-feature';
import {
  RockExplorerPath,
  cloneParkingSites,
  clonePaths,
  newPathId,
} from '../../models/rock-explorer-misc';
import type { RockExplorerDraftSnapshot } from './offline/rock-explorer-draft.types';

/** localStorage key for stable hard-lock device id (Phase 10). */
export const RECORDING_DEVICE_ID_KEY = 'rockExplorer.recordingDeviceId';

/** Keep GPS point only after this many meters (CONTEXT D-06). */
export const MIN_PATH_POINT_DISTANCE_M = 5;

/** Sync after this many newly kept points (discretion). */
export const SYNC_POINT_INTERVAL = 10;

/** Sync after this many ms while recording (discretion). */
export const SYNC_TIME_INTERVAL_MS = 30_000;

export type RecordingState = 'recording' | 'paused';

export type GpsFix = {
  lng: number;
  lat: number;
  accuracyM?: number | null;
  timestampMs?: number | null;
  altitudeM?: number | null;
};

/**
 * Persist or create a stable recording device id for draft hard-lock.
 */
export function getOrCreateRecordingDeviceId(
  storage: Storage = localStorage,
): string {
  const existing = storage.getItem(RECORDING_DEVICE_ID_KEY);
  if (existing && existing.trim().length > 0) {
    return existing;
  }
  const id = crypto.randomUUID();
  storage.setItem(RECORDING_DEVICE_ID_KEY, id);
  return id;
}

/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(
  a: { lng: number; lat: number },
  b: { lng: number; lat: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const r = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Whether to keep a GPS fix given the last kept point (distance filter).
 * First point (no last) is always kept.
 */
export function shouldKeepGpsPoint(
  lastKept: { lng: number; lat: number } | null,
  next: { lng: number; lat: number },
  minDistanceM: number = MIN_PATH_POINT_DISTANCE_M,
): boolean {
  if (!lastKept) {
    return true;
  }
  return distanceMeters(lastKept, next) >= minDistanceM;
}

/** Encode GPS fix as GeoJSON Position [lng, lat, …optional numerics]. */
export function gpsFixToPosition(fix: GpsFix): Position {
  const coords: number[] = [fix.lng, fix.lat];
  if (fix.altitudeM != null && Number.isFinite(fix.altitudeM)) {
    coords.push(fix.altitudeM);
  }
  if (fix.timestampMs != null && Number.isFinite(fix.timestampMs)) {
    coords.push(fix.timestampMs);
  }
  if (fix.accuracyM != null && Number.isFinite(fix.accuracyM)) {
    coords.push(fix.accuracyM);
  }
  return coords as Position;
}

function emptyDraftFeature(deviceId: string): RockExplorerFeature {
  const feature = new RockExplorerFeature();
  feature.title = null;
  feature.description = null;
  feature.potential = null;
  feature.rockQuality = null;
  feature.rockType = null;
  feature.gradeLineType = null;
  feature.gradeScale = null;
  feature.gradeValueMin = null;
  feature.gradeValueMax = null;
  feature.accessIssues = [];
  feature.geometry = null;
  feature.parkingSites = [];
  feature.paths = [];
  feature.topoLinks = [];
  feature.createdBy = null;
  feature.status = 'draft';
  feature.recordingDeviceId = deviceId;
  feature.recordingState = 'recording';
  feature.recordingUpdatedAt = null;
  return feature;
}

function newGpsPath(): RockExplorerPath {
  return {
    id: newPathId(),
    source: 'gps',
    title: null,
    description: null,
    geometry: { type: 'LineString', coordinates: [] },
  };
}

/**
 * In-memory live-tracking session (local-first). Map host owns geolocation watch.
 */
export class RockExplorerRecordingSession {
  feature: RockExplorerFeature;
  /** Path currently receiving GPS points (may be open with &lt;2 verts). */
  activePathId: string | null = null;
  /** Points kept since last successful sync attempt. */
  keptSinceSync = 0;
  lastSyncAtMs = 0;
  private lastKept: { lng: number; lat: number } | null = null;

  constructor(deviceId: string = getOrCreateRecordingDeviceId()) {
    this.feature = emptyDraftFeature(deviceId);
    this.startNewPathInternal();
  }

  get recordingState(): RecordingState {
    return this.feature.recordingState ?? 'paused';
  }

  get isRecording(): boolean {
    return this.recordingState === 'recording';
  }

  get activePath(): RockExplorerPath | null {
    if (!this.activePathId) {
      return null;
    }
    return this.feature.paths.find((p) => p.id === this.activePathId) ?? null;
  }

  pause(): void {
    this.feature.recordingState = 'paused';
    this.touchRecording();
  }

  resume(): void {
    if (!this.activePathId) {
      this.startNewPathInternal();
    }
    this.feature.recordingState = 'recording';
    this.touchRecording();
  }

  /**
   * Close current path if ≥2 vertices. Leaves session paused.
   * @returns false if path cannot be finished yet
   */
  finishPath(): boolean {
    const path = this.activePath;
    if (!path || path.geometry.coordinates.length < 2) {
      return false;
    }
    this.activePathId = null;
    this.lastKept = null;
    this.feature.recordingState = 'paused';
    this.touchRecording();
    return true;
  }

  /** Start a new GPS LineString and set recording. */
  newPath(): void {
    this.startNewPathInternal();
    this.feature.recordingState = 'recording';
    this.touchRecording();
  }

  /**
   * Append a GPS fix if recording and distance filter passes.
   * @returns true if a point was kept
   */
  tryAppendFix(fix: GpsFix): boolean {
    if (!this.isRecording) {
      return false;
    }
    let path = this.activePath;
    if (!path) {
      this.startNewPathInternal();
      path = this.activePath;
    }
    if (!path) {
      return false;
    }
    if (!shouldKeepGpsPoint(this.lastKept, fix)) {
      return false;
    }
    path.geometry.coordinates.push(gpsFixToPosition(fix));
    this.lastKept = { lng: fix.lng, lat: fix.lat };
    this.keptSinceSync += 1;
    this.touchRecording();
    return true;
  }

  /** Whether cadence says we should attempt an online sync. */
  shouldSyncNow(nowMs: number = Date.now()): boolean {
    if (this.keptSinceSync >= SYNC_POINT_INTERVAL) {
      return true;
    }
    if (
      this.lastSyncAtMs > 0 &&
      nowMs - this.lastSyncAtMs >= SYNC_TIME_INTERVAL_MS &&
      this.keptSinceSync > 0
    ) {
      return true;
    }
    if (this.lastSyncAtMs === 0 && this.keptSinceSync > 0) {
      // After first kept point, allow immediate create sync.
      return true;
    }
    return false;
  }

  markSynced(nowMs: number = Date.now()): void {
    this.keptSinceSync = 0;
    this.lastSyncAtMs = nowMs;
  }

  /** Paths safe to PUT (≥2 verts); open path with 0–1 verts omitted until finished or second point. */
  pathsForSerialize(): RockExplorerPath[] {
    return this.feature.paths.filter(
      (p) => (p.geometry?.coordinates?.length ?? 0) >= 2,
    );
  }

  /**
   * Full local snapshot for IndexedDB — includes open short paths and session fields.
   * Never use RockExplorerFeature.serialize() for local restore.
   */
  toSnapshot(): RockExplorerDraftSnapshot {
    const f = this.feature;
    return {
      feature: {
        id: f.id,
        timeCreated: f.timeCreated,
        timeUpdated: f.timeUpdated,
        title: f.title,
        description: f.description,
        status: f.status,
        recordingDeviceId: f.recordingDeviceId,
        recordingState: f.recordingState,
        recordingUpdatedAt: f.recordingUpdatedAt,
        potential: f.potential,
        rockQuality: f.rockQuality,
        rockType: f.rockType,
        gradeLineType: f.gradeLineType,
        gradeScale: f.gradeScale,
        gradeValueMin: f.gradeValueMin,
        gradeValueMax: f.gradeValueMax,
        accessIssues: [...(f.accessIssues ?? [])],
        geometry: f.geometry ? structuredClone(f.geometry) : null,
        parkingSites: cloneParkingSites(f.parkingSites),
        paths: clonePaths(f.paths),
        topoLinks: [],
        createdBy: null,
      },
      activePathId: this.activePathId,
      keptSinceSync: this.keptSinceSync,
      lastSyncAtMs: this.lastSyncAtMs,
      lastKept: this.lastKept ? { ...this.lastKept } : null,
    };
  }

  /**
   * Restore a session from a local IDB snapshot (Continue / refresh).
   * Reconstructs open 0–1 vertex paths that API serialize would drop.
   */
  static hydrateFromSnapshot(
    snapshot: RockExplorerDraftSnapshot,
    deviceId?: string,
  ): RockExplorerRecordingSession {
    const device =
      deviceId ??
      (typeof snapshot.feature['recordingDeviceId'] === 'string'
        ? (snapshot.feature['recordingDeviceId'] as string)
        : getOrCreateRecordingDeviceId());
    const session = new RockExplorerRecordingSession(device);
    session.feature = RockExplorerFeature.deserialize({
      ...snapshot.feature,
      // Ensure all paths (including short open ones) are present
      paths: snapshot.feature['paths'] ?? [],
    });
    if (deviceId) {
      session.feature.recordingDeviceId = deviceId;
    }
    session.activePathId = snapshot.activePathId;
    session.keptSinceSync = snapshot.keptSinceSync;
    session.lastSyncAtMs = snapshot.lastSyncAtMs;
    session.lastKept = snapshot.lastKept ? { ...snapshot.lastKept } : null;
    return session;
  }

  private startNewPathInternal(): void {
    const path = newGpsPath();
    this.feature.paths = [...this.feature.paths, path];
    this.activePathId = path.id;
    this.lastKept = null;
  }

  private touchRecording(): void {
    this.feature.recordingUpdatedAt = new Date().toISOString();
  }
}
