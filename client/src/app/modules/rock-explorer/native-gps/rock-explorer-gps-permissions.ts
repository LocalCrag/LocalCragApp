import type { GpsBridgePlugin } from './gps-bridge';

/** true = user accepted Play-compliant prominent background-location disclosure. */
export type TrackingPermissionDisclosure = () => Promise<boolean>;

export type EnsureTrackingPermissionsDeps = {
  bridge: GpsBridgePlugin;
  showBackgroundDisclosure: TrackingPermissionDisclosure;
  /**
   * When false (API < 33), skip POST_NOTIFICATIONS step.
   * Default (plan 03): detect via Capacitor platform + device info or injected flag.
   */
  needsPostNotifications?: () => boolean;
};

/**
 * Staged GPS-04 order (D-08): FG location → disclosure → BG → POST_NOTIFICATIONS (13+) → true.
 * Any required deny / disclosure reject → false (caller runs onGeoPermissionDenied — D-09).
 * POST_NOTIFICATIONS deny = hard stop.
 * Never calls `bridge.start()` — FGS starts after the gate via shim watch (D-05).
 */
export async function ensureRockExplorerTrackingPermissions(
  deps: EnsureTrackingPermissionsDeps,
): Promise<boolean> {
  const { bridge, showBackgroundDisclosure } = deps;
  const needsPostNotifications = deps.needsPostNotifications ?? (() => false);

  let state = await bridge.checkPermissions();

  if (state.location !== 'granted') {
    const fg = await bridge.requestPermissions();
    if (fg.location !== 'granted') {
      return false;
    }
    state = await bridge.checkPermissions();
  }

  if (state.background !== 'granted') {
    const accepted = await showBackgroundDisclosure();
    if (!accepted) {
      return false;
    }
    const bg = await bridge.requestBackgroundPermission();
    if (bg.background !== 'granted') {
      return false;
    }
    state = await bridge.checkPermissions();
  }

  if (needsPostNotifications() && state.notifications !== 'granted') {
    const notif = await bridge.requestNotificationPermission();
    if (notif.notifications !== 'granted') {
      return false;
    }
  }

  return true;
}
