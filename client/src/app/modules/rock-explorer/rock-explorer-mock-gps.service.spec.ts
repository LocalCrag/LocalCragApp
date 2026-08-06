import { offsetLatLng } from './rock-explorer-mock-gps.service';

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
