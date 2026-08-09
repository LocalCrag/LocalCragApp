import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import type { GpsBridgePlugin, GpsFixPayload } from './gps-bridge';
import {
  installNativeGpsShim,
  uninstallNativeGpsShim,
} from './rock-explorer-native-gps.shim';

describe('RockExplorerNativeGpsShim (Wave 0)', () => {
  let isNativeSpy: jasmine.Spy;
  let fakeBridge: jasmine.SpyObj<GpsBridgePlugin>;
  let locationUpdateListener: ((fix: GpsFixPayload) => void) | null;
  let listenerRemove: jasmine.Spy<() => Promise<void>>;
  let nativeGetCurrentPosition: jasmine.Spy;
  let nativeWatchPosition: jasmine.Spy;
  let nativeClearWatch: jasmine.Spy;

  beforeEach(() => {
    isNativeSpy = spyOn(Capacitor, 'isNativePlatform');
    locationUpdateListener = null;
    listenerRemove = jasmine
      .createSpy('listenerRemove')
      .and.resolveTo(undefined);

    fakeBridge = jasmine.createSpyObj<GpsBridgePlugin>('GpsBridge', [
      'start',
      'stop',
      'getCurrentPosition',
      'checkPermissions',
      'requestPermissions',
      'requestBackgroundPermission',
      'requestNotificationPermission',
      'addListener',
    ]);
    fakeBridge.start.and.resolveTo();
    fakeBridge.stop.and.resolveTo();
    fakeBridge.checkPermissions.and.resolveTo({ location: 'granted' });
    fakeBridge.requestPermissions.and.resolveTo({ location: 'granted' });
    fakeBridge.requestBackgroundPermission.and.resolveTo({
      background: 'granted',
    });
    fakeBridge.requestNotificationPermission.and.resolveTo({
      notifications: 'granted',
    });
    fakeBridge.getCurrentPosition.and.resolveTo({
      latitude: 48.1,
      longitude: 11.5,
      accuracy: 5,
      timestamp: Date.now(),
    });
    fakeBridge.addListener.and.callFake(
      async (
        eventName: 'locationUpdate',
        listenerFunc: (fix: GpsFixPayload) => void,
      ): Promise<PluginListenerHandle> => {
        if (eventName === 'locationUpdate') {
          locationUpdateListener = listenerFunc;
        }
        return { remove: listenerRemove };
      },
    );

    nativeGetCurrentPosition = jasmine.createSpy('getCurrentPosition');
    nativeWatchPosition = jasmine.createSpy('watchPosition').and.returnValue(1);
    nativeClearWatch = jasmine.createSpy('clearWatch');

    spyOnProperty(navigator, 'geolocation', 'get').and.returnValue({
      getCurrentPosition: nativeGetCurrentPosition,
      watchPosition: nativeWatchPosition,
      clearWatch: nativeClearWatch,
    } as unknown as Geolocation);
  });

  afterEach(() => {
    uninstallNativeGpsShim();
  });

  it('installNativeGpsShim is a no-op when Capacitor.isNativePlatform() is false', () => {
    isNativeSpy.and.returnValue(false);
    const beforeGet = navigator.geolocation.getCurrentPosition;
    const beforeWatch = navigator.geolocation.watchPosition;
    const beforeClear = navigator.geolocation.clearWatch;

    installNativeGpsShim(fakeBridge);

    expect(navigator.geolocation.getCurrentPosition).toBe(beforeGet);
    expect(navigator.geolocation.watchPosition).toBe(beforeWatch);
    expect(navigator.geolocation.clearWatch).toBe(beforeClear);
    expect(fakeBridge.addListener).not.toHaveBeenCalled();
    expect(fakeBridge.start).not.toHaveBeenCalled();
  });

  it('on native, install patches getCurrentPosition, watchPosition, and clearWatch', () => {
    isNativeSpy.and.returnValue(true);
    const beforeGet = navigator.geolocation.getCurrentPosition;
    const beforeWatch = navigator.geolocation.watchPosition;
    const beforeClear = navigator.geolocation.clearWatch;

    installNativeGpsShim(fakeBridge);

    expect(navigator.geolocation.getCurrentPosition).not.toBe(beforeGet);
    expect(navigator.geolocation.watchPosition).not.toBe(beforeWatch);
    expect(navigator.geolocation.clearWatch).not.toBe(beforeClear);
  });

  it('maps finite locationUpdate payloads to GeolocationPosition for watchers', async () => {
    isNativeSpy.and.returnValue(true);
    installNativeGpsShim(fakeBridge);

    const positions: GeolocationPosition[] = [];
    const watchId = navigator.geolocation.watchPosition((pos) => {
      positions.push(pos);
    });
    expect(watchId).toBeGreaterThan(0);

    // Allow async permission / listener / start to settle.
    await Promise.resolve();
    await Promise.resolve();

    expect(locationUpdateListener).not.toBeNull();
    locationUpdateListener?.({
      latitude: 48.137,
      longitude: 11.575,
      accuracy: 8,
      altitude: 520,
      heading: 90,
      speed: 1.2,
      timestamp: 1_700_000_000_000,
    });

    expect(positions.length).toBe(1);
    expect(positions[0].coords.latitude).toBe(48.137);
    expect(positions[0].coords.longitude).toBe(11.575);
    expect(Number.isFinite(positions[0].coords.latitude)).toBeTrue();
    expect(Number.isFinite(positions[0].coords.longitude)).toBeTrue();
  });

  it('drops locationUpdate payloads with non-finite lat or lng', async () => {
    isNativeSpy.and.returnValue(true);
    installNativeGpsShim(fakeBridge);

    const success = jasmine.createSpy('watchSuccess');
    navigator.geolocation.watchPosition(success);

    await Promise.resolve();
    await Promise.resolve();

    expect(locationUpdateListener).not.toBeNull();
    locationUpdateListener?.({
      latitude: NaN,
      longitude: 11.575,
      timestamp: Date.now(),
    });
    locationUpdateListener?.({
      latitude: 48.1,
      longitude: Infinity,
      timestamp: Date.now(),
    });
    locationUpdateListener?.({
      latitude: -Infinity,
      longitude: NaN,
      timestamp: Date.now(),
    });

    expect(success).not.toHaveBeenCalled();
  });

  it('calls plugin stop and removes listener when the last watcher is cleared', async () => {
    isNativeSpy.and.returnValue(true);
    installNativeGpsShim(fakeBridge);

    const watchId = navigator.geolocation.watchPosition(() => undefined);

    await Promise.resolve();
    await Promise.resolve();

    expect(fakeBridge.start).toHaveBeenCalled();
    expect(fakeBridge.addListener).toHaveBeenCalled();

    navigator.geolocation.clearWatch(watchId);

    await Promise.resolve();
    await Promise.resolve();

    expect(fakeBridge.stop).toHaveBeenCalledTimes(1);
    expect(listenerRemove).toHaveBeenCalledTimes(1);
  });
});
