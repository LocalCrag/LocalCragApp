/** Default walk speed for Record-mode GPS simulation (meters per second). */
export const MOCK_GPS_SPEED_MPS = 5;

/**
 * Position tick interval. At {@link MOCK_GPS_SPEED_MPS} ≈ 5 m per tick, which
 * matches Rock Explorer’s “keep point every ~5 m” path sampling.
 */
export const MOCK_GPS_TICK_MS = 1000;

/** Offset mock start from the real fix (meters) — far enough to explore freely. */
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
 * Dev-only GPS walker for Rock Explorer Record mode and map locate.
 *
 * ## Enabling
 * Set top-level `mockGpsRecording = true` in `environments/environment.ts`
 * (false in prod/e2e). Rock Explorer loads this class via
 * `rock-explorer-mock-gps.loader.ts` → dynamic `import()`. Production builds
 * replace that loader with a null stub (`*.loader.prod.ts`) so this module is
 * not on the prod module graph.
 *
 * ## Behavior
 * 1. **Seed** — once from a real device fix (or map-center fallback), offset
 *    several km away so you are not standing on the start point; or
 *    `seedNear()` when continuing a draft (tens of meters from the feature).
 * 2. **Walk** — ~{@link MOCK_GPS_SPEED_MPS} m/s on a semi-random heading with
 *    soft curves and occasional larger turns ({@link MOCK_GPS_TICK_MS} ticks).
 * 3. **Shim** — `installNavigatorShim()` patches `navigator.geolocation` so
 *    MapLibre `GeolocateControl`, Record `watchPosition`, and one-shot image
 *    geotags all share the same simulated position.
 *
 * Instantiate with `new` after dynamic import (not Angular `providedIn`).
 * Call `uninstallNavigatorShim()` when leaving Rock Explorer.
 */
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
  /** Used when device GPS is unavailable during first seed (e.g. map center). */
  private fallbackProvider: (() => LatLng | undefined) | null = null;
  private nativeGetCurrentPosition: Geolocation['getCurrentPosition'] | null =
    null;
  private nativeWatchPosition: Geolocation['watchPosition'] | null = null;
  private nativeClearWatch: Geolocation['clearWatch'] | null = null;

  /** True after the first successful seed (device, fallback, or seedNear). */
  get isSeeded(): boolean {
    return this.seeded;
  }

  /** True while `navigator.geolocation` methods are patched. */
  get isShimInstalled(): boolean {
    return this.shimInstalled;
  }

  /** Current simulated WGS84 position. */
  get currentLatLng(): LatLng {
    return { lat: this.lat, lng: this.lng };
  }

  /**
   * Patch `navigator.geolocation` so locate + watch callers use this walker.
   * Seeding still uses the **native** getCurrentPosition once (saved below)
   * so the walk can start near a real fix. Idempotent.
   *
   * @param fallbackProvider Optional lat/lng when device GPS fails (map center).
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

  /** Restore real `navigator.geolocation` (leave Rock Explorer / tear-down). */
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
   * Ensure a seed exists (no-op if already seeded). Concurrent callers share
   * one in-flight promise. Prefer {@link seedNear} when resuming a draft.
   *
   * If {@link resetSeed} / {@link seedNear} bumps the generation while a
   * seed is in flight, that attempt no-ops — this loops until a current
   * generation actually seeds (so callers never resolve against lat/lng 0,0).
   */
  async ensureSeeded(fallback?: LatLng): Promise<void> {
    while (!this.seeded) {
      if (this.seedPromise) {
        await this.seedPromise;
        continue;
      }
      const generation = this.seedGeneration;
      this.seedPromise = this.seedOnce(
        fallback ?? this.fallbackProvider?.(),
        generation,
      ).finally(() => {
        if (this.seedGeneration === generation) {
          this.seedPromise = null;
        }
      });
      await this.seedPromise;
      if (!this.seeded && generation === this.seedGeneration) {
        throw new Error('Mock GPS seed failed');
      }
    }
  }

  /**
   * Drop the current seed so the next {@link ensureSeeded} picks a new far
   * offset (e.g. starting a brand-new Record session). Active watchers are
   * notified once the new seed completes.
   *
   * @returns Promise that resolves when reseed (if any watchers) finishes, or
   *   immediately when there are no watchers yet.
   */
  resetSeed(): Promise<void> {
    this.seedGeneration += 1;
    this.seeded = false;
    this.seedPromise = null;
    if (this.watchers.size === 0) {
      return Promise.resolve();
    }
    return this.ensureSeeded(this.fallbackProvider?.()).then(() => {
      if (!this.seeded) {
        return;
      }
      const pos = this.buildPosition();
      for (const watcher of this.watchers.values()) {
        watcher.success(pos);
      }
      this.ensureTimer();
    });
  }

  /**
   * Place the walker near `origin` immediately (small random offset).
   * Used when continuing / resuming a draft so Record starts on the feature
   * instead of kilometers away. Cancels any in-flight far {@link ensureSeeded}.
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

  /**
   * Subscribe to simulated positions (same contract as
   * `navigator.geolocation.watchPosition`). Starts the tick timer.
   */
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

  /** Stop a {@link watchPosition} subscription; stops the timer when none remain. */
  clearWatch(watchId: number): void {
    this.watchers.delete(watchId);
    if (this.watchers.size === 0) {
      this.stopTimer();
    }
  }

  /**
   * One-shot simulated fix. Errors if not yet seeded (callers that go through
   * the shim wait on {@link ensureSeeded} first).
   */
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

  /**
   * Shimmed getCurrentPosition: wait for seed, then return one simulated fix.
   * Used after {@link installNavigatorShim} patches the global API.
   */
  private shimGetCurrentPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ): void {
    void this.ensureSeeded(this.fallbackProvider?.()).then(
      () => {
        if (!this.seeded) {
          error?.(makePositionError(2, 'Mock GPS seed failed'));
          return;
        }
        success(this.buildPosition());
      },
      () => error?.(makePositionError(2, 'Mock GPS seed failed')),
    );
  }

  /**
   * Shimmed watchPosition: register watcher, seed if needed, emit first fix,
   * then let {@link tick} push updates. Drops the watcher if seed fails.
   */
  private shimWatchPosition(
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ): number {
    const id = this.nextWatchId++;
    this.watchers.set(id, { success, error });
    void this.ensureSeeded(this.fallbackProvider?.()).then(
      () => {
        if (!this.watchers.has(id) || !this.seeded) {
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

  /**
   * One-shot far seed: native device fix → random offset
   * [{@link START_OFFSET_M_MIN}, {@link START_OFFSET_M_MAX}] m, else fallback.
   * Aborts if `generation` no longer matches {@link seedGeneration} (superseded
   * by {@link seedNear} / {@link resetSeed}).
   */
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

  /**
   * Set lat/lng to a random point within [minOffsetM, maxOffsetM] of `origin`,
   * pick initial heading + curve bias, and mark seeded.
   */
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

  /**
   * Read one real device fix via the **native** getCurrentPosition (saved before
   * the shim), so seeding is not circular through the mock.
   */
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

  /** Start the walk interval if not already running (no-op when already on). */
  private ensureTimer(): void {
    if (this.timerId != null) {
      return;
    }
    this.timerId = setInterval(() => this.tick(), MOCK_GPS_TICK_MS);
  }

  /** Clear the walk interval when no watchers remain. */
  private stopTimer(): void {
    if (this.timerId != null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Advance the walker one step and notify all watchers.
   * Soft heading drift most ticks; larger turns on a schedule
   * ({@link scheduleNextTurn}) with occasional curve-bias flips.
   */
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

  /** Pick a random tick count until the next larger heading change. */
  private scheduleNextTurn(): void {
    this.ticksUntilTurn =
      HEADING_CHANGE_EVERY_TICKS_MIN +
      Math.floor(
        Math.random() *
          (HEADING_CHANGE_EVERY_TICKS_MAX - HEADING_CHANGE_EVERY_TICKS_MIN + 1),
      );
  }

  /** Build a GeolocationPosition for the current lat/lng/heading/speed. */
  private buildPosition(): GeolocationPosition {
    return makeGeolocationPosition(
      this.lat,
      this.lng,
      MOCK_GPS_SPEED_MPS,
      this.headingRad,
    );
  }
}

/**
 * Move `distanceM` along `bearingRad` from a WGS84 point (spherical earth).
 * Used for seed offsets and each walk step.
 */
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
    // Normalize longitude to (−180, 180].
    lng: (((lng2 * 180) / Math.PI + 540) % 360) - 180,
  };
}

/**
 * Minimal GeolocationPosition / Coordinates for MapLibre and Record watches.
 * Includes `toJSON` so structured clones / logging behave like the browser API.
 */
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

/** Build a GeolocationPositionError-shaped object (code 2 = POSITION_UNAVAILABLE). */
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
