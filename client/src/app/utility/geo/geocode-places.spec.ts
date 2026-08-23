import {
  buildPhotonGeocodeUrl,
  mapPhotonFeatureToPlace,
  mapPhotonResponseToPlaces,
} from './geocode-places';

describe('geocode-places', () => {
  describe('buildPhotonGeocodeUrl', () => {
    it('encodes query and default limit', () => {
      const url = buildPhotonGeocodeUrl('München Hauptbahnhof');
      expect(url.startsWith('https://photon.komoot.io/api/?')).toBeTrue();
      const params = new URL(url).searchParams;
      expect(params.get('q')).toBe('München Hauptbahnhof');
      expect(params.get('limit')).toBe('5');
    });

    it('adds language and proximity when provided', () => {
      const url = buildPhotonGeocodeUrl('Zugspitze', {
        limit: 3,
        language: 'de',
        proximity: { lat: 47.4, lng: 11.0 },
      });
      const params = new URL(url).searchParams;
      expect(params.get('limit')).toBe('3');
      expect(params.get('lang')).toBe('de');
      expect(params.get('lat')).toBe('47.4');
      expect(params.get('lon')).toBe('11');
    });
  });

  describe('mapPhotonFeatureToPlace', () => {
    it('maps geometry and builds a readable label', () => {
      const place = mapPhotonFeatureToPlace({
        geometry: { type: 'Point', coordinates: [11.576, 48.137] },
        properties: {
          osm_type: 'N',
          osm_id: 123,
          name: 'Marienplatz',
          city: 'München',
          country: 'Germany',
        },
      });
      expect(place).toEqual({
        id: 'N:123',
        label: 'Marienplatz, München, Germany',
        coordinates: { lat: 48.137, lng: 11.576 },
      });
    });

    it('formats street addresses without a name', () => {
      const place = mapPhotonFeatureToPlace(
        {
          geometry: { coordinates: [11.5, 48.1] },
          properties: {
            housenumber: '1',
            street: 'Teststraße',
            postcode: '80331',
            city: 'München',
          },
        },
        2,
      );
      expect(place?.id).toBe('photon-2');
      expect(place?.label).toBe('1 Teststraße, 80331, München');
    });

    it('returns null when coordinates are missing', () => {
      expect(
        mapPhotonFeatureToPlace({
          properties: { name: 'Nowhere' },
        }),
      ).toBeNull();
    });
  });

  describe('mapPhotonResponseToPlaces', () => {
    it('maps a FeatureCollection and skips invalid features', () => {
      const places = mapPhotonResponseToPlaces({
        type: 'FeatureCollection',
        features: [
          {
            geometry: { coordinates: [10, 50] },
            properties: { osm_type: 'W', osm_id: 1, name: 'A' },
          },
          { geometry: { coordinates: [1] }, properties: { name: 'bad' } },
          {
            geometry: { coordinates: [11, 49] },
            properties: { osm_type: 'N', osm_id: 2, name: 'B' },
          },
        ],
      });
      expect(places.map((p) => p.label)).toEqual(['A', 'B']);
    });

    it('returns an empty list for invalid payloads', () => {
      expect(mapPhotonResponseToPlaces(null)).toEqual([]);
      expect(mapPhotonResponseToPlaces({})).toEqual([]);
      expect(mapPhotonResponseToPlaces({ features: 'nope' })).toEqual([]);
    });
  });
});
