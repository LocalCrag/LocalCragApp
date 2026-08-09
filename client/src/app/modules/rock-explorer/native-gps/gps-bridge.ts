import { InjectionToken } from '@angular/core';
import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

/** Native fix payload emitted by the GpsBridge Capacitor plugin. */
export interface GpsFixPayload {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  altitude?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export type LocationPermissionState =
  'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';

/**
 * Thin Capacitor plugin wrapping Android Fused Location (foreground).
 * Implemented natively in plan 02; consumed by the navigator.geolocation shim.
 */
export interface GpsBridgePlugin {
  start(options?: { intervalMs?: number }): Promise<void>;
  stop(): Promise<void>;
  getCurrentPosition(): Promise<GpsFixPayload>;
  checkPermissions(): Promise<{ location: LocationPermissionState }>;
  requestPermissions(): Promise<{ location: LocationPermissionState }>;
  addListener(
    eventName: 'locationUpdate',
    listenerFunc: (fix: GpsFixPayload) => void,
  ): Promise<PluginListenerHandle>;
}

/** Production default = Capacitor registerPlugin('GpsBridge'). */
export const GpsBridge = registerPlugin<GpsBridgePlugin>('GpsBridge');

/**
 * Injectable seam so unit tests never call the real Capacitor bridge
 * (mirror EXIT_APP in hardware-back-button.service.ts).
 */
export const GPS_BRIDGE = new InjectionToken<GpsBridgePlugin>('GPS_BRIDGE', {
  providedIn: 'root',
  factory: () => GpsBridge,
});
