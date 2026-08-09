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
 *
 * Wave 0 stub — real orchestration lands in plan 03.
 */
export async function ensureRockExplorerTrackingPermissions(
  _deps: EnsureTrackingPermissionsDeps,
): Promise<boolean> {
  return false;
}
