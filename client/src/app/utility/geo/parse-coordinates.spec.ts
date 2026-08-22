import { parseCoordinatesInput } from './parse-coordinates';

describe('parseCoordinatesInput', () => {
  it('parses comma-separated lat, lng', () => {
    expect(parseCoordinatesInput('48.137154, 11.576124')).toEqual({
      lat: 48.137154,
      lng: 11.576124,
    });
  });

  it('parses space-separated lat lng', () => {
    expect(parseCoordinatesInput('48.137154 11.576124')).toEqual({
      lat: 48.137154,
      lng: 11.576124,
    });
  });

  it('trims surrounding whitespace', () => {
    expect(parseCoordinatesInput('  48.1 , 11.5  ')).toEqual({
      lat: 48.1,
      lng: 11.5,
    });
  });

  it('accepts boundary values', () => {
    expect(parseCoordinatesInput('-90, -180')).toEqual({ lat: -90, lng: -180 });
    expect(parseCoordinatesInput('90, 180')).toEqual({ lat: 90, lng: 180 });
  });

  it('returns null for empty input', () => {
    expect(parseCoordinatesInput('')).toBeNull();
    expect(parseCoordinatesInput('   ')).toBeNull();
  });

  it('returns null for too few or too many parts', () => {
    expect(parseCoordinatesInput('48.1')).toBeNull();
    expect(parseCoordinatesInput('48.1, 11.5, 0')).toBeNull();
  });

  it('returns null for non-numeric values', () => {
    expect(parseCoordinatesInput('north, east')).toBeNull();
  });

  it('returns null for out-of-range latitude', () => {
    expect(parseCoordinatesInput('91, 11')).toBeNull();
    expect(parseCoordinatesInput('-90.1, 11')).toBeNull();
  });

  it('returns null for out-of-range longitude', () => {
    expect(parseCoordinatesInput('48, 181')).toBeNull();
    expect(parseCoordinatesInput('48, -180.1')).toBeNull();
  });
});
