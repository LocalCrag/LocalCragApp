import {
  offsetLatLng,
  RockExplorerMockGpsService,
} from './rock-explorer-mock-gps.service';

describe('RockExplorerMockGpsService helpers', () => {
  it('offsetLatLng moves roughly the requested distance north', () => {
    const start = { lat: 48.0, lng: 11.0 };
    const north = offsetLatLng(start.lat, start.lng, 0, 100);
    // ~111.32 m per degree latitude
    const dLatM = (north.lat - start.lat) * 111_320;
    expect(dLatM).toBeGreaterThan(95);
    expect(dLatM).toBeLessThan(105);
    expect(Math.abs(north.lng - start.lng)).toBeLessThan(0.00001);
  });

  it('offsetLatLng moves roughly the requested distance east', () => {
    const start = { lat: 48.0, lng: 11.0 };
    const east = offsetLatLng(start.lat, start.lng, Math.PI / 2, 100);
    const metersPerDegLng = 111_320 * Math.cos((start.lat * Math.PI) / 180);
    const dLngM = (east.lng - start.lng) * metersPerDegLng;
    expect(dLngM).toBeGreaterThan(95);
    expect(dLngM).toBeLessThan(105);
    expect(Math.abs(east.lat - start.lat)).toBeLessThan(0.00001);
  });
});

describe('RockExplorerMockGpsService seed races', () => {
  let mock: RockExplorerMockGpsService;
  let nativeGetCurrentPosition: jasmine.Spy;

  beforeEach(() => {
    mock = new RockExplorerMockGpsService();
    nativeGetCurrentPosition = jasmine
      .createSpy('getCurrentPosition')
      .and.callFake(
        (success: PositionCallback, _error?: PositionErrorCallback | null) => {
          // Async native fix so resetSeed can race the in-flight seedOnce.
          queueMicrotask(() =>
            success({
              coords: {
                latitude: 48.1,
                longitude: 11.5,
                accuracy: 10,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                toJSON() {
                  return this;
                },
              },
              timestamp: Date.now(),
              toJSON() {
                return this;
              },
            } as GeolocationPosition),
          );
        },
      );

    spyOnProperty(navigator, 'geolocation', 'get').and.returnValue({
      getCurrentPosition: nativeGetCurrentPosition,
      watchPosition: jasmine.createSpy('watchPosition'),
      clearWatch: jasmine.createSpy('clearWatch'),
    } as unknown as Geolocation);

    mock.installNavigatorShim(() => ({ lat: 50, lng: 10 }));
  });

  afterEach(() => {
    mock.uninstallNavigatorShim();
  });

  it('does not emit [0,0] when resetSeed aborts an in-flight ensureSeeded', async () => {
    const positions: Array<{ lat: number; lng: number }> = [];

    // Start watch while native getCurrentPosition is still pending.
    const firstFix = new Promise<void>((resolve) => {
      navigator.geolocation.watchPosition((pos) => {
        positions.push({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        resolve();
      });
    });

    // Abort that in-flight seed (same race as fire-and-forget resetSeed).
    await mock.resetSeed();
    await firstFix;
    // Flush any late callbacks from the aborted generation.
    await Promise.resolve();
    await Promise.resolve();

    expect(positions.length).toBeGreaterThan(0);
    for (const p of positions) {
      expect(Math.abs(p.lat) + Math.abs(p.lng)).toBeGreaterThan(0.1);
    }
  });
});
