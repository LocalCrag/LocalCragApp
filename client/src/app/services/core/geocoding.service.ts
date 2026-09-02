import { Injectable } from '@angular/core';
import { Observable, defer, of } from 'rxjs';
import { Coordinates } from '../../interfaces/coordinates.interface';
import {
  GeocodePlace,
  buildPhotonGeocodeUrl,
  mapPhotonResponseToPlaces,
} from '../../utility/geo/geocode-places';

/**
 * Forward geocoding via Photon (OSM). Uses `fetch` so app HTTP interceptors
 * (credentials/CSRF, offline banner) do not apply to the third-party host.
 */
@Injectable({ providedIn: 'root' })
export class GeocodingService {
  search(
    query: string,
    options?: { limit?: number; language?: string; proximity?: Coordinates },
  ): Observable<GeocodePlace[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return of([]);
    }
    const url = buildPhotonGeocodeUrl(trimmed, options);
    return defer(() =>
      fetch(url).then(async (response) => {
        if (!response.ok) {
          throw new Error(`Geocoding failed with status ${response.status}`);
        }
        return mapPhotonResponseToPlaces(await response.json());
      }),
    );
  }
}
