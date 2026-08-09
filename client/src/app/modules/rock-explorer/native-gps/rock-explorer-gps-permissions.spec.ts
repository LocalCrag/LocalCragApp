import type { GpsBridgePlugin, LocationPermissionState } from './gps-bridge';
import { ensureRockExplorerTrackingPermissions } from './rock-explorer-gps-permissions';

type PermSnapshot = {
  location: LocationPermissionState;
  background?: LocationPermissionState;
  notifications?: LocationPermissionState;
};

function createFakeBridge(
  initial: PermSnapshot,
): jasmine.SpyObj<GpsBridgePlugin> & { state: PermSnapshot } {
  const bridge = jasmine.createSpyObj<GpsBridgePlugin>('GpsBridge', [
    'start',
    'stop',
    'getCurrentPosition',
    'checkPermissions',
    'requestPermissions',
    'requestBackgroundPermission',
    'requestNotificationPermission',
    'addListener',
  ]) as jasmine.SpyObj<GpsBridgePlugin> & { state: PermSnapshot };
  bridge.state = { ...initial };

  bridge.checkPermissions.and.callFake(async () => ({ ...bridge.state }));
  bridge.requestPermissions.and.callFake(async () => {
    bridge.state.location = 'granted';
    return { location: bridge.state.location };
  });
  bridge.requestBackgroundPermission.and.callFake(async () => {
    bridge.state.background = 'granted';
    return { background: bridge.state.background };
  });
  bridge.requestNotificationPermission.and.callFake(async () => {
    bridge.state.notifications = 'granted';
    return { notifications: bridge.state.notifications };
  });
  bridge.start.and.resolveTo();
  bridge.stop.and.resolveTo();

  return bridge;
}

describe('ensureRockExplorerTrackingPermissions (Wave 0 RED / GPS-04)', () => {
  let disclosure: jasmine.Spy<() => Promise<boolean>>;

  beforeEach(() => {
    disclosure = jasmine
      .createSpy('showBackgroundDisclosure')
      .and.resolveTo(true);
  });

  it('requests FG first when location is not granted, then disclosure before BG', async () => {
    const bridge = createFakeBridge({
      location: 'prompt',
      background: 'prompt',
      notifications: 'prompt',
    });
    const callOrder: string[] = [];
    bridge.requestPermissions.and.callFake(async () => {
      callOrder.push('requestPermissions');
      bridge.state.location = 'granted';
      return { location: 'granted' };
    });
    disclosure.and.callFake(async () => {
      callOrder.push('disclosure');
      return true;
    });
    bridge.requestBackgroundPermission.and.callFake(async () => {
      callOrder.push('requestBackgroundPermission');
      bridge.state.background = 'granted';
      return { background: 'granted' };
    });
    bridge.requestNotificationPermission.and.callFake(async () => {
      callOrder.push('requestNotificationPermission');
      bridge.state.notifications = 'granted';
      return { notifications: 'granted' };
    });

    const ok = await ensureRockExplorerTrackingPermissions({
      bridge,
      showBackgroundDisclosure: disclosure,
      needsPostNotifications: () => true,
    });

    expect(ok).toBeTrue();
    expect(bridge.requestPermissions).toHaveBeenCalled();
    expect(disclosure).toHaveBeenCalled();
    expect(bridge.requestBackgroundPermission).toHaveBeenCalled();
    expect(bridge.requestNotificationPermission).toHaveBeenCalled();
    expect(callOrder).toEqual([
      'requestPermissions',
      'disclosure',
      'requestBackgroundPermission',
      'requestNotificationPermission',
    ]);
    expect(bridge.start).not.toHaveBeenCalled();
  });

  it('does not request BG when disclosure is rejected', async () => {
    const bridge = createFakeBridge({
      location: 'granted',
      background: 'prompt',
      notifications: 'granted',
    });
    disclosure.and.resolveTo(false);

    const ok = await ensureRockExplorerTrackingPermissions({
      bridge,
      showBackgroundDisclosure: disclosure,
      needsPostNotifications: () => false,
    });

    expect(ok).toBeFalse();
    expect(disclosure).toHaveBeenCalled();
    expect(bridge.requestBackgroundPermission).not.toHaveBeenCalled();
    expect(bridge.start).not.toHaveBeenCalled();
  });

  it('returns false when BG permission is denied', async () => {
    const bridge = createFakeBridge({
      location: 'granted',
      background: 'prompt',
      notifications: 'granted',
    });
    bridge.requestBackgroundPermission.and.resolveTo({
      background: 'denied',
    });

    const ok = await ensureRockExplorerTrackingPermissions({
      bridge,
      showBackgroundDisclosure: disclosure,
      needsPostNotifications: () => false,
    });

    expect(ok).toBeFalse();
    expect(bridge.requestBackgroundPermission).toHaveBeenCalled();
    expect(bridge.start).not.toHaveBeenCalled();
  });

  it('returns false when notifications are denied on API 33+ (hard stop)', async () => {
    const bridge = createFakeBridge({
      location: 'granted',
      background: 'granted',
      notifications: 'prompt',
    });
    bridge.requestNotificationPermission.and.resolveTo({
      notifications: 'denied',
    });

    const ok = await ensureRockExplorerTrackingPermissions({
      bridge,
      showBackgroundDisclosure: disclosure,
      needsPostNotifications: () => true,
    });

    expect(ok).toBeFalse();
    expect(bridge.requestNotificationPermission).toHaveBeenCalled();
    expect(bridge.start).not.toHaveBeenCalled();
  });

  it('skips POST_NOTIFICATIONS when needsPostNotifications is false', async () => {
    const bridge = createFakeBridge({
      location: 'granted',
      background: 'granted',
      notifications: 'prompt',
    });

    const ok = await ensureRockExplorerTrackingPermissions({
      bridge,
      showBackgroundDisclosure: disclosure,
      needsPostNotifications: () => false,
    });

    expect(ok).toBeTrue();
    expect(bridge.requestNotificationPermission).not.toHaveBeenCalled();
    expect(disclosure).not.toHaveBeenCalled();
    expect(bridge.start).not.toHaveBeenCalled();
  });

  it('returns true without disclosure when FG+BG+notifications already granted', async () => {
    const bridge = createFakeBridge({
      location: 'granted',
      background: 'granted',
      notifications: 'granted',
    });

    const ok = await ensureRockExplorerTrackingPermissions({
      bridge,
      showBackgroundDisclosure: disclosure,
      needsPostNotifications: () => true,
    });

    expect(ok).toBeTrue();
    expect(disclosure).not.toHaveBeenCalled();
    expect(bridge.requestPermissions).not.toHaveBeenCalled();
    expect(bridge.requestBackgroundPermission).not.toHaveBeenCalled();
    expect(bridge.requestNotificationPermission).not.toHaveBeenCalled();
    expect(bridge.start).not.toHaveBeenCalled();
  });

  it('never calls bridge.start — orchestrator only gates permissions', async () => {
    const bridge = createFakeBridge({
      location: 'granted',
      background: 'granted',
      notifications: 'granted',
    });

    await ensureRockExplorerTrackingPermissions({
      bridge,
      showBackgroundDisclosure: disclosure,
      needsPostNotifications: () => true,
    });

    expect(bridge.start).not.toHaveBeenCalled();
  });
});
