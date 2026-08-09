import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import {
  GpsBridge,
  type GpsBridgePlugin,
  type GpsFixPayload,
} from './gps-bridge';

type Watcher = {
  success: PositionCallback;
  error: PositionErrorCallback | null | undefined;
};

/** Module-scoped state so the shim survives Angular CD / child re-renders (D-09). */
let shimInstalled = false;
let activeBridge: GpsBridgePlugin = GpsBridge;
let nextWatchId = 1;
const watchers = new Map<number, Watcher>();
let locationListener: PluginListenerHandle | null = null;
let nativeStartInFlight: Promise<void> | null = null;

let nativeGetCurrentPosition: Geolocation['getCurrentPosition'] | null = null;
let nativeWatchPosition: Geolocation['watchPosition'] | null = null;
let nativeClearWatch: Geolocation['clearWatch'] | null = null;

/**
 * Patch `navigator.geolocation` to fan out GpsBridge `locationUpdate` events.
 * No-op on web (`!Capacitor.isNativePlatform()`). Does not request permissions
 * or start the plugin — that happens on first watch / get (and Record facade hook).
 *
 * @param bridge Optional test double; defaults to registered `GpsBridge`.
 */
export function installNativeGpsShim(bridge?: GpsBridgePlugin): void {
  if (!Capacitor.isNativePlatform() || shimInstalled) {
    return;
  }
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return;
  }

  activeBridge = bridge ?? GpsBridge;
  const geo = navigator.geolocation;
  nativeGetCurrentPosition = geo.getCurrentPosition.bind(geo);
  nativeWatchPosition = geo.watchPosition.bind(geo);
  nativeClearWatch = geo.clearWatch.bind(geo);

  geo.getCurrentPosition = (
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ) => {
    void shimGetCurrentPosition(success, error);
  };
  geo.watchPosition = (
    success: PositionCallback,
    error?: PositionErrorCallback | null,
    _options?: PositionOptions,
  ) => shimWatchPosition(success, error);
  geo.clearWatch = (watchId: number) => {
    void shimClearWatch(watchId);
  };

  shimInstalled = true;
}

/** Restore real `navigator.geolocation` and force-stop the native plugin. */
export function uninstallNativeGpsShim(): void {
  if (!shimInstalled) {
    return;
  }

  if (
    typeof navigator !== 'undefined' &&
    navigator.geolocation &&
    nativeGetCurrentPosition &&
    nativeWatchPosition &&
    nativeClearWatch
  ) {
    navigator.geolocation.getCurrentPosition = nativeGetCurrentPosition;
    navigator.geolocation.watchPosition = nativeWatchPosition;
    navigator.geolocation.clearWatch = nativeClearWatch;
  }

  nativeGetCurrentPosition = null;
  nativeWatchPosition = null;
  nativeClearWatch = null;
  watchers.clear();
  nextWatchId = 1;
  shimInstalled = false;

  void forceStopNative();
}

/** True while `navigator.geolocation` methods are patched. */
export function isNativeGpsShimInstalled(): boolean {
  return shimInstalled;
}

async function shimGetCurrentPosition(
  success: PositionCallback,
  error?: PositionErrorCallback | null,
): Promise<void> {
  try {
    const fix = await activeBridge.getCurrentPosition();
    const pos = toGeolocationPosition(fix);
    if (!pos) {
      error?.(makePositionError(2, 'Invalid location fix'));
      return;
    }
    success(pos);
  } catch (err) {
    error?.(mapBridgeError(err));
  }
}

function shimWatchPosition(
  success: PositionCallback,
  error?: PositionErrorCallback | null,
): number {
  const id = nextWatchId++;
  watchers.set(id, { success, error });
  void ensureNativeStarted().catch((err) => {
    if (!watchers.has(id)) {
      return;
    }
    watchers.delete(id);
    error?.(mapBridgeError(err));
    void maybeStopNative();
  });
  return id;
}

async function shimClearWatch(watchId: number): Promise<void> {
  watchers.delete(watchId);
  await maybeStopNative();
}

async function ensureNativeStarted(): Promise<void> {
  if (watchers.size === 0) {
    return;
  }
  if (nativeStartInFlight) {
    await nativeStartInFlight;
    return;
  }
  nativeStartInFlight = (async () => {
    if (!locationListener) {
      locationListener = await activeBridge.addListener(
        'locationUpdate',
        (fix) => {
          const pos = toGeolocationPosition(fix);
          if (!pos) {
            return;
          }
          for (const watcher of watchers.values()) {
            watcher.success(pos);
          }
        },
      );
    }
    await activeBridge.start({ intervalMs: 1000 });
  })();
  try {
    await nativeStartInFlight;
  } finally {
    nativeStartInFlight = null;
  }
}

async function maybeStopNative(): Promise<void> {
  if (watchers.size > 0) {
    return;
  }
  await forceStopNative();
}

async function forceStopNative(): Promise<void> {
  try {
    await activeBridge.stop();
  } catch {
    // Best-effort stop on uninstall / last clearWatch.
  }
  if (locationListener) {
    try {
      await locationListener.remove();
    } catch {
      // Ignore remove failures during tear-down.
    }
    locationListener = null;
  }
}

/**
 * Map plugin payload → GeolocationPosition. Returns null when lat/lng are
 * non-finite so callers can drop the update (T-17-03).
 */
function toGeolocationPosition(fix: GpsFixPayload): GeolocationPosition | null {
  const lat = fix.latitude;
  const lng = fix.longitude;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const accuracy =
    fix.accuracy != null && Number.isFinite(fix.accuracy) ? fix.accuracy : null;
  const altitude =
    fix.altitude != null && Number.isFinite(fix.altitude) ? fix.altitude : null;
  const heading =
    fix.heading != null && Number.isFinite(fix.heading) ? fix.heading : null;
  const speed =
    fix.speed != null && Number.isFinite(fix.speed) ? fix.speed : null;
  const timestamp =
    fix.timestamp != null && Number.isFinite(fix.timestamp)
      ? fix.timestamp
      : Date.now();

  const coords: GeolocationCoordinates = {
    latitude: lat,
    longitude: lng,
    accuracy: accuracy ?? 0,
    altitude,
    altitudeAccuracy: null,
    heading,
    speed,
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
    timestamp,
    toJSON() {
      return { coords: coords.toJSON(), timestamp: this.timestamp };
    },
  };
}

function mapBridgeError(err: unknown): GeolocationPositionError {
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: unknown }).message)
      : String(err ?? 'Location error');
  const codeRaw =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  if (codeRaw.includes('PERMISSION') || /permission/i.test(message)) {
    return makePositionError(1, message || 'Permission denied');
  }
  return makePositionError(2, message || 'Position unavailable');
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
