import { Injectable } from '@angular/core';

/** Default walk speed for Record-mode GPS simulation. */
export const MOCK_GPS_SPEED_MPS = 5;

/** Position tick interval (5 m/s × 1 s ≈ one kept path point per tick). */
export const MOCK_GPS_TICK_MS = 1000;

/** Offset mock start from the real fix (meters) — within ~50 km. */
const START_OFFSET_M_MIN = 5_000;
const START_OFFSET_M_MAX = 50_000;

/** When continuing a draft, spawn this close to the polygon centroid. */
const CONTINUE_OFFSET_M_MIN = 15;
const CONTINUE_OFFSET_M_MAX = 80;

/** How often (ticks) to nudge heading for a semi-random path. */
const HEADING_CHANGE_EVERY_TICKS_MIN = 3;
const HEADING_CHANGE_EVERY_TICKS_MAX = 8;

/** Max heading turn in degrees when nudging. */
const HEADING_TURN_DEG_MAX = 70;

/** Chance each tick to apply a small continuous curve (in addition to bigger turns). */
const CONTINUOUS_CURVE_CHANCE = 0.35;
/** Soft heading drift per tick when curving (degrees). */
const CONTINUOUS_CURVE_DEG_MAX = 10;

const EARTH_RADIUS_M = 6_371_000;

type Watcher = {
  success: PositionCallback;
  error: PositionErrorCallback | null | undefined;
};

type LatLng = { lat: number; lng: number };

/**
 * Dev-only GPS simulator for Rock Explorer.
 * Seeds near a real (or fallback) fix, then walks ~5 m/s on a semi-random path.
 * When installed as a navigator.geolocation shim, MapLibre GeolocateControl
 * and Record-mode watches share the same simulated position.
 */
@Injectable({ providedIn: 'root' })
export class RockExplorerMockGpsService {
  private lat = 0;
  private lng = 0;
  private headingRad = 0;
  /** Persistent turn bias (−1 left / +1 right) so paths arc instead of zigzag. */
  private curveBias = 1;
  private ticksUntilTurn = 0;
  private seeded = false;
  private seedPromise: Promise<void> | null = null;
  /** Bumped to invalidate in-flight seedOnce when seedNear/resetSeed wins. */
  private seedGeneration = 0;
  private nextWatchId = 1;
  private readonly watchers = new Map<number, Watcher>();
  private timerId: ReturnType<typeof setInterval> | null = null;

  private shimInstalled = false;
  private fallbackProvider: (() => LatLng | undefined) | null = null;
  private nativeGetCurrentPosition: Geolocation['getCurrentPosition'] | null =
    null;
  private nativeWatchPosition: Geolocation['watchPosition'] | null = null;
  private nativeClearWatch: Geolocation['clearWatch'] | null = null;

  get isSeeded(): boolean {
    return this.seeded;
  }

  get isShimInstalled(): boolean {
    return this.shimInstalled;
  }

  get currentLatLng(): LatLng {
    return { lat: this.lat, lng: this.lng };
  }

  /**
   * Patch navigator.geolocation so locate control + any getCurrent/watch
   * callers receive the simulated walker (after seeding from real GPS).
   */
  installNavigatorShim(fallbackProvider?: () => LatLng | undefined): void {
    if (this.shimInstalled || typeof navigator === 'undefined') {
      return;
    }
    if (!navigator.geolocation) {
      return;
    }

    this.fallbackProvider = fallbackProvider ?? null;
    const geo = navigator.geolocation;
    this.nativeGetCurrentPosition = geo.getCurrentPosition.bind(geo);
    this.nativeWatchPosition = geo.watchPosition.bind(geo);
    this.nativeClearWatch = geo.clearWatch.bind(geo);

    geo.getCurrentPosition = (
      success: PositionCallback,
      error?: PositionErrorCallback | null,
      options?: PositionOptions,
    ) => {
      this.shimGetCurrentPosition(success, error, options);
    };
    geo.watchPosition = (
      success: PositionCallback,
      error?: PositionErrorCallback | null,
      options?: PositionOptions,
    ) => this.shimWatchPosition(success, error, options);
    geo.clearWatch = (watchId: number) => {
      this.clearWatch(watchId);
    };

    this.shimInstalled = true;
  }

  /** Restore real navigator.geolocation (e.g. when leaving Rock Explorer). */
  uninstallNavigatorShim(): void {
    if (!this.shimInstalled || typeof navigator === 'undefined') {
      return;
    }
    if (
      navigator.geolocation &&
      this.nativeGetCurrentPosition &&
      this.nativeWatchPosition &&
      this.nativeClearWatch
    ) {
      navigator.geolocation.getCurrentPosition = this.nativeGetCurrentPosition;
      navigator.geolocation.watchPosition = this.nativeWatchPosition;
      navigator.geolocation.clearWatch = this.nativeClearWatch;
    }
    this.nativeGetCurrentPosition = null;
    this.nativeWatchPosition = null;
    this.nativeClearWatch = null;
    this.fallbackProvider = null;
    this.shimInstalled = false;
  }

  /**
   * Seed from device GPS once, offset into a nearby region, then ready to walk.
   * Falls back to `fallback` (e.g. map center) when geolocation is unavailable.
   */
  async ensureSeeded(fallback?: LatLng): Promise<void> {
    if (this.seeded) {
      return;
    }
    if (this.seedPromise) {
      return this.seedPromise;
    }
    const generation = this.seedGeneration;
    this.seedPromise = this.seedOnce(fallback, generation).finally(() => {
      if (this.seedGeneration === generation) {
        this.seedPromise = null;
      }
    });
    return this.seedPromise;
  }

  /** Force a re-seed on the next ensureSeeded call (e.g. new Record session). */
  resetSeed(): void {
    this.seedGeneration += 1;
    this.seeded = false;
    this.seedPromise = null;
    if (this.watchers.size > 0) {
      void this.ensureSeeded(this.fallbackProvider?.()).then(() => {
        const pos = this.buildPosition();
        for (const watcher of this.watchers.values()) {
          watcher.success(pos);
        }
        this.ensureTimer();
      });
    }
  }

  /**
   * Place the walker near `origin` (small random offset). Used when continuing
   * an existing draft so Record resumes close to the feature polygon.
   */
  seedNear(
    origin: LatLng,
    options?: { minOffsetM?: number; maxOffsetM?: number },
  ): void {
    const min = options?.minOffsetM ?? CONTINUE_OFFSET_M_MIN;
    const max = options?.maxOffsetM ?? CONTINUE_OFFSET_M_MAX;
    // Invalidate any in-flight far seedOnce from device GPS.
    this.seedGeneration += 1;
    this.seedPromise = null;
    this.applySeedOrigin(origin, min, max);
    if (this.watchers.size > 0) {
      const pos = this.buildPosition();
      for (const watcher of this.watchers.values()) {
        watcher.success(pos);
      }
      this.ensureTimer();
    }
  }

  watchPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ): number {
    const id = this.nextWatchId++;
    this.watchers.set(id, { success, error });
    queueMicrotask(() => {
      if (this.watchers.has(id) && this.seeded) {
        success(this.buildPosition());
      }
    });
    this.ensureTimer();
    return id;
  }

  clearWatch(watchId: number): void {
    this.watchers.delete(watchId);
    if (this.watchers.size === 0) {
      this.stopTimer();
    }
  }

  getCurrentPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ): void {
    if (!this.seeded) {
      error?.(makePositionError(2, 'Mock GPS not seeded'));
      return;
    }
    queueMicrotask(() => success(this.buildPosition()));
  }

  private shimGetCurrentPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ): void {
    void this.ensureSeeded(this.fallbackProvider?.()).then(
      () => success(this.buildPosition()),
      () => error?.(makePositionError(2, 'Mock GPS seed failed')),
    );
  }

  private shimWatchPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ): number {
    const id = this.nextWatchId++;
    this.watchers.set(id, { success, error });
    void this.ensureSeeded(this.fallbackProvider?.()).then(
      () => {
        if (!this.watchers.has(id)) {
          return;
        }
        success(this.buildPosition());
        this.ensureTimer();
      },
      () => {
        this.watchers.delete(id);
        error?.(makePositionError(2, 'Mock GPS seed failed'));
      },
    );
    return id;
  }

  private async seedOnce(
    fallback: LatLng | undefined,
    generation: number,
  ): Promise<void> {
    let origin: LatLng;
    try {
      const pos = await this.readDevicePosition();
      if (generation !== this.seedGeneration) {
        return;
      }
      origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      if (generation !== this.seedGeneration) {
        return;
      }
      const fb = fallback ?? this.fallbackProvider?.();
      if (!fb) {
        throw new Error('Mock GPS seed failed: no device fix and no fallback');
      }
      origin = fb;
    }

    if (generation !== this.seedGeneration) {
      return;
    }
    this.applySeedOrigin(origin, START_OFFSET_M_MIN, START_OFFSET_M_MAX);
  }

  private applySeedOrigin(
    origin: LatLng,
    minOffsetM: number,
    maxOffsetM: number,
  ): void {
    const offsetM = minOffsetM + Math.random() * (maxOffsetM - minOffsetM);
    const bearingRad = Math.random() * Math.PI * 2;
    const start = offsetLatLng(origin.lat, origin.lng, bearingRad, offsetM);
    this.lat = start.lat;
    this.lng = start.lng;
    this.headingRad = Math.random() * Math.PI * 2;
    this.curveBias = Math.random() < 0.5 ? -1 : 1;
    this.scheduleNextTurn();
    this.seeded = true;
  }

  private readDevicePosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      const getCurrent =
        this.nativeGetCurrentPosition ??
        navigator.geolocation?.getCurrentPosition?.bind(navigator.geolocation);
      if (!getCurrent) {
        reject(new Error('geolocation unavailable'));
        return;
      }
      getCurrent(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60_000,
      });
    });
  }

  private ensureTimer(): void {
    if (this.timerId != null) {
      return;
    }
    this.timerId = setInterval(() => this.tick(), MOCK_GPS_TICK_MS);
  }

  private stopTimer(): void {
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private tick(): void {
    if (!this.seeded || this.watchers.size === 0) {
      return;
    }

    // Soft continuous curve most ticks → smooth arcs.
    if (Math.random() < CONTINUOUS_CURVE_CHANCE) {
      const driftDeg =
        this.curveBias *
        (0.35 + Math.random() * 0.65) *
        CONTINUOUS_CURVE_DEG_MAX;
      this.headingRad += (driftDeg * Math.PI) / 180;
    }

    const stepM = MOCK_GPS_SPEED_MPS * (MOCK_GPS_TICK_MS / 1000);
    const next = offsetLatLng(this.lat, this.lng, this.headingRad, stepM);
    this.lat = next.lat;
    this.lng = next.lng;

    this.ticksUntilTurn -= 1;
    if (this.ticksUntilTurn <= 0) {
      // Occasional direction flip; usually keep curving the same way.
      if (Math.random() < 0.25) {
        this.curveBias *= -1;
      }
      const turnDeg =
        this.curveBias * (15 + Math.random() * (HEADING_TURN_DEG_MAX - 15));
      this.headingRad += (turnDeg * Math.PI) / 180;
      this.scheduleNextTurn();
    }

    const pos = this.buildPosition();
    for (const watcher of this.watchers.values()) {
      watcher.success(pos);
    }
  }

  private scheduleNextTurn(): void {
    this.ticksUntilTurn =
      HEADING_CHANGE_EVERY_TICKS_MIN +
      Math.floor(
        Math.random() *
          (HEADING_CHANGE_EVERY_TICKS_MAX - HEADING_CHANGE_EVERY_TICKS_MIN + 1),
      );
  }

  private buildPosition(): GeolocationPosition {
    return makeGeolocationPosition(
      this.lat,
      this.lng,
      MOCK_GPS_SPEED_MPS,
      this.headingRad,
    );
  }
}

/** Move `distanceM` along `bearingRad` from a WGS84 point. */
export function offsetLatLng(
  lat: number,
  lng: number,
  bearingRad: number,
  distanceM: number,
): { lat: number; lng: number } {
  const angular = distanceM / EARTH_RADIUS_M;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angular) +
      Math.cos(lat1) * Math.sin(angular) * Math.cos(bearingRad),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(angular) * Math.cos(lat1),
      Math.cos(angular) - Math.sin(lat1) * Math.sin(lat2),
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

function makeGeolocationPosition(
  lat: number,
  lng: number,
  speedMps: number,
  headingRad: number,
): GeolocationPosition {
  const headingDeg = ((((headingRad * 180) / Math.PI) % 360) + 360) % 360;
  const coords: GeolocationCoordinates = {
    latitude: lat,
    longitude: lng,
    accuracy: 4,
    altitude: null,
    altitudeAccuracy: null,
    heading: headingDeg,
    speed: speedMps,
    toJSON() {
      return {
        latitude: this.latitude,
        longitude: this.longitude,
        accuracy: this.accuracy,
        altitude: this.altitude,
        altitudeAccuracy: this.altitudeAccuracy,
        heading: this.heading,
        speed: this.speed,
      };
    },
  };
  return {
    coords,
    timestamp: Date.now(),
    toJSON() {
      return { coords: coords.toJSON(), timestamp: this.timestamp };
    },
  };
}

function makePositionError(
  code: number,
  message: string,
): GeolocationPositionError {
  return {
    code,
    message,
    PERMISSION_DENIED: 1,
    POSITION_UNAVAILABLE: 2,
    TIMEOUT: 3,
  };
}
