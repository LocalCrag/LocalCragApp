import { Coordinates } from '../../interfaces/coordinates.interface';
import { isValidLatitude } from '../validators/lat.validator';
import { isValidLongitude } from '../validators/lng.validator';

/**
 * Parses a pasted coordinate string in "lat, lng" or "lat lng" form.
 * Returns null when the input is empty or not two valid numbers.
 */
export function parseCoordinatesInput(input: string): Coordinates | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const parts = trimmed.split(/[,\s]+/).filter(Boolean);
  if (parts.length !== 2) {
    return null;
  }
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!isValidLatitude(lat) || !isValidLongitude(lng)) {
    return null;
  }
  return { lat, lng };
}
