import type { GpsBridgePlugin } from './gps-bridge';

/**
 * Wave 0 stub — plan 03 replaces with a real navigator.geolocation shim that
 * fans out GpsBridge `locationUpdate` events and starts/stops by watcher refcount.
 *
 * Specs in `rock-explorer-native-gps.shim.spec.ts` are expected RED until then.
 */
export function installNativeGpsShim(_bridge?: GpsBridgePlugin): void {
  // NOT_IMPLEMENTED until plan 03
}

/** Restore real navigator.geolocation (no-op stub until plan 03). */
export function uninstallNativeGpsShim(): void {
  // NOT_IMPLEMENTED until plan 03
}
