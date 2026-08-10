import { RockExplorerCustomMapLayers } from './rock-explorer-custom-map-layers';
import { RockExplorerMapLayer } from '../../../models/rock-explorer-map-layer';

describe('RockExplorerCustomMapLayers', () => {
  function createMapMock() {
    const sources = new Map<string, unknown>();
    const layers = new Map<string, unknown>();
    return {
      sources,
      layers,
      addSource: jasmine.createSpy('addSource').and.callFake((id, source) => {
        sources.set(id, source);
      }),
      addLayer: jasmine.createSpy('addLayer').and.callFake((layer) => {
        layers.set(layer.id, layer);
      }),
      getSource: jasmine
        .createSpy('getSource')
        .and.callFake((id) => sources.get(id)),
      getLayer: jasmine
        .createSpy('getLayer')
        .and.callFake((id) => layers.get(id)),
      setLayoutProperty: jasmine.createSpy('setLayoutProperty'),
      setPaintProperty: jasmine.createSpy('setPaintProperty'),
      moveLayer: jasmine.createSpy('moveLayer'),
      removeLayer: jasmine.createSpy('removeLayer').and.callFake((id) => {
        layers.delete(id);
      }),
      removeSource: jasmine.createSpy('removeSource').and.callFake((id) => {
        sources.delete(id);
      }),
    };
  }

  const tilejsonLayer: RockExplorerMapLayer = {
    id: 'dgm',
    name: 'DGM',
    sourceKind: 'tilejson',
    url: 'https://tiles.example.org/dgm/tiles.json',
    type: 'raster',
    opacity: 0.45,
    tileSize: 256,
    defaultOn: true,
  };

  const tilesLayer: RockExplorerMapLayer = {
    id: 'xyz',
    name: 'XYZ',
    sourceKind: 'tiles',
    url: 'https://tiles.example.org/{z}/{x}/{y}.png',
    type: 'raster',
    opacity: 0.5,
    tileSize: 512,
    defaultOn: false,
  };

  it('adds tilejson sources via url and tiles sources via tiles array', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);

    helper.apply([tilejsonLayer, tilesLayer], true);

    expect(map.addSource).toHaveBeenCalledWith('re-custom-src-dgm', {
      type: 'raster',
      url: tilejsonLayer.url,
      tileSize: 256,
    });
    expect(map.addSource).toHaveBeenCalledWith('re-custom-src-xyz', {
      type: 'raster',
      tiles: [tilesLayer.url],
      tileSize: 512,
    });
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-dgm',
        type: 'raster',
        source: 're-custom-src-dgm',
        paint: { 'raster-opacity': 0.45 },
        layout: { visibility: 'visible' },
      }),
    );
  });

  it('defaults tileSize to 256 when omitted', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    const withoutTileSize = {
      ...tilejsonLayer,
      tileSize: undefined,
    } as unknown as RockExplorerMapLayer;

    helper.apply([withoutTileSize], false);

    expect(map.addSource).toHaveBeenCalledWith(
      're-custom-src-dgm',
      jasmine.objectContaining({ tileSize: 256 }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        layout: { visibility: 'none' },
      }),
    );
  });

  it('toggles visibility on all applied custom layers', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    helper.apply([tilejsonLayer, tilesLayer], true);

    helper.setVisibility(false);

    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      're-custom-dgm',
      'visibility',
      'none',
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith(
      're-custom-xyz',
      'visibility',
      'none',
    );
  });

  it('honors per-layer visibility when master is on', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);

    helper.apply([tilejsonLayer, tilesLayer], true, null, {
      dgm: true,
      xyz: false,
    });

    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-dgm',
        layout: { visibility: 'visible' },
      }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-xyz',
        layout: { visibility: 'none' },
      }),
    );
  });

  it('reorders custom layers via moveLayer', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    helper.apply([tilejsonLayer, tilesLayer], true);
    map.moveLayer.calls.reset();

    helper.reorder(['xyz', 'dgm']);

    expect(map.moveLayer.calls.allArgs()).toEqual([
      ['re-custom-xyz'],
      ['re-custom-dgm'],
    ]);
  });

  it('applies session opacity overrides over settings defaults', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);

    helper.apply([tilejsonLayer], true, { dgm: 0.2 });

    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        paint: { 'raster-opacity': 0.2 },
      }),
    );
  });

  it('updates a single overlay opacity via setOpacity', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    helper.apply([tilejsonLayer], true);

    helper.setOpacity('dgm', 0.8);

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      're-custom-dgm',
      'raster-opacity',
      0.8,
    );
  });

  it('is idempotent-safe when sources already absent on a fresh style', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    helper.apply([tilejsonLayer], true);
    expect(map.addSource).toHaveBeenCalledTimes(1);

    // Fresh style: sources/layers wiped; helper apply again after re-instantiation
    const map2 = createMapMock();
    const helper2 = new RockExplorerCustomMapLayers(map2 as any);
    helper2.apply([tilejsonLayer], true);
    expect(map2.addSource).toHaveBeenCalledTimes(1);
    expect(map2.addLayer).toHaveBeenCalledTimes(1);
  });
});
