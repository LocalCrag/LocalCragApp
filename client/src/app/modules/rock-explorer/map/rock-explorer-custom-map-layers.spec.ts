import { RockExplorerCustomMapLayers } from './rock-explorer-custom-map-layers';
import { MapOverlay } from '../../../models/map-overlay';

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
      queryRenderedFeatures: jasmine
        .createSpy('queryRenderedFeatures')
        .and.returnValue([]),
    };
  }

  const vectorLayer: MapOverlay = {
    id: 'ns',
    name: 'Naturschutz',
    sourceKind: 'tiles',
    url: 'https://tiles.example.org/ns/{z}/{x}/{y}.pbf',
    type: 'vector',
    opacity: 0.35,
    tileSize: 256,
    layers: [
      {
        name: 'NSG',
        sourceLayer: 'nsg',
        paintMode: 'solid',
        color: '#228B22',
        categoricalProperty: '',
        categoricalStops: [],
        defaultActive: true,
      },
      {
        name: 'LSG',
        sourceLayer: 'lsg',
        paintMode: 'solid',
        color: '#1d3557',
        categoricalProperty: '',
        categoricalStops: [],
        defaultActive: false,
      },
    ],
  };

  const tilejsonLayer: MapOverlay = {
    id: 'dgm',
    name: 'DGM',
    sourceKind: 'tilejson',
    url: 'https://tiles.example.org/dgm/tiles.json',
    type: 'raster',
    opacity: 0.45,
    tileSize: 256,
    layers: [],
  };

  const tilesLayer: MapOverlay = {
    id: 'xyz',
    name: 'XYZ',
    sourceKind: 'tiles',
    url: 'https://tiles.example.org/{z}/{x}/{y}.png',
    type: 'raster',
    opacity: 0.5,
    tileSize: 512,
    layers: [],
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
    } as unknown as MapOverlay;

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

  it('adds vector sources with fill and outline layers per source-layer', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);

    helper.apply([vectorLayer], true);

    expect(map.addSource).toHaveBeenCalledWith('re-custom-src-ns', {
      type: 'vector',
      tiles: [vectorLayer.url],
    });
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-ns--0',
        type: 'fill',
        source: 're-custom-src-ns',
        'source-layer': 'nsg',
        paint: { 'fill-color': '#228B22', 'fill-opacity': 0.35 },
      }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-ns--1',
        type: 'fill',
        'source-layer': 'lsg',
        paint: { 'fill-color': '#1d3557', 'fill-opacity': 0.35 },
      }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-ns--0-outline',
        type: 'line',
        'source-layer': 'nsg',
      }),
    );
  });

  it('applies categorical match expressions for fill and outline colors', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    const categorical: MapOverlay = {
      ...vectorLayer,
      layers: [
        {
          name: 'Geologie',
          sourceLayer: 'guek300',
          paintMode: 'categorical',
          color: '#888888',
          categoricalProperty: 'AERA',
          categoricalStops: [
            { value: 'Känozoikum', color: '#f4a261' },
            { value: 'Mesozoikum', color: '#2a9d8f' },
          ],
          defaultActive: true,
        },
      ],
    };

    helper.apply([categorical], true);

    const expectedColor = [
      'match',
      ['to-string', ['get', 'AERA']],
      'Känozoikum',
      '#f4a261',
      'Mesozoikum',
      '#2a9d8f',
      '#888888',
    ];
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-ns--0',
        paint: jasmine.objectContaining({
          'fill-color': expectedColor,
        }),
      }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-ns--0-outline',
        paint: jasmine.objectContaining({
          'line-color': expectedColor,
        }),
      }),
    );
  });

  it('skips vector overlays without layers', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);

    helper.apply([{ ...vectorLayer, layers: [] }], true);

    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });

  it('honors per-source-layer visibility under a vector overlay', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);

    helper.apply([vectorLayer], true, null, {
      ns: true,
      'ns--0': true,
      'ns--1': false,
    });

    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-ns--0',
        layout: { visibility: 'visible' },
      }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      jasmine.objectContaining({
        id: 're-custom-ns--1',
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

  it('reorders custom layers via moveLayer with first on top', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    helper.apply([tilejsonLayer, tilesLayer], true);
    map.moveLayer.calls.reset();

    helper.reorder(['xyz', 'dgm']);

    // Bottom entries are moved first so the first list id ends on top.
    expect(map.moveLayer.calls.allArgs()).toEqual([
      ['re-custom-dgm'],
      ['re-custom-xyz'],
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

  it('updates vector overlay opacity via setOpacity', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    helper.apply([vectorLayer], true);
    map.setPaintProperty.calls.reset();

    helper.setOpacity('ns', 0.8);

    expect(map.setPaintProperty).toHaveBeenCalledWith(
      're-custom-ns--0',
      'fill-opacity',
      0.8,
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      're-custom-ns--0-outline',
      'line-opacity',
      1,
    );
    expect(map.setPaintProperty).toHaveBeenCalledWith(
      're-custom-ns--1',
      'fill-opacity',
      0.8,
    );
  });

  it('queries unique vector fill features at a point (top-most first)', () => {
    const map = createMapMock();
    const helper = new RockExplorerCustomMapLayers(map as any);
    helper.apply([vectorLayer], true);
    map.queryRenderedFeatures.and.returnValue([
      { layer: { id: 're-custom-ns--0' }, properties: { name: 'A' } },
      { layer: { id: 're-custom-ns--0' }, properties: { name: 'A' } },
      { layer: { id: 're-custom-ns--1' }, properties: { name: 'B' } },
    ]);

    const hits = helper.queryVectorFeaturesAtPoint({ x: 12, y: 34 });

    expect(map.queryRenderedFeatures).toHaveBeenCalledWith([12, 34], {
      layers: ['re-custom-ns--1', 're-custom-ns--0'],
    });
    expect(hits).toEqual([
      { layerId: 're-custom-ns--0', properties: { name: 'A' } },
      { layerId: 're-custom-ns--1', properties: { name: 'B' } },
    ]);
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
