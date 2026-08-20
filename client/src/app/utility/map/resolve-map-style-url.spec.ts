import { MapBaseLayer } from '../../models/map-base-layer';
import {
  pickRockExplorerDefaultBaseLayerId,
  pickTopoBaseLayerId,
  resolveMapBaseLayers,
  styleUrlForBaseLayer,
  styleUrlForTopoBaseLayer,
} from './resolve-map-style-url';

describe('resolve-map-style-url', () => {
  const layers = [
    MapBaseLayer.deserialize({
      id: 'maptiler-topo',
      name: 'Topo',
      styleUrl: 'https://api.maptiler.com/maps/topo-v2/style.json?key=abc',
      topoDefault: true,
      rockExplorerDefault: true,
      defaultOverlayIds: [],
    }),
    MapBaseLayer.deserialize({
      id: 'maptiler-satellite',
      name: 'Satellite',
      styleUrl: 'https://api.maptiler.com/maps/satellite/style.json?key=abc',
      topoDefault: false,
      rockExplorerDefault: false,
      defaultOverlayIds: [],
    }),
  ];

  it('filters incomplete configured layers', () => {
    expect(
      resolveMapBaseLayers([
        ...layers,
        MapBaseLayer.deserialize({ id: '', name: 'x', styleUrl: '' }),
      ]),
    ).toEqual(layers);
  });

  it('picks topo and rock-explorer default ids', () => {
    expect(pickTopoBaseLayerId(layers)).toBe('maptiler-topo');
    expect(pickRockExplorerDefaultBaseLayerId(layers)).toBe('maptiler-topo');
  });

  it('resolves style URL by layer id', () => {
    expect(styleUrlForBaseLayer(layers, 'maptiler-satellite')).toContain(
      'satellite',
    );
  });

  it('resolves topo base layer style URL for lc-map', () => {
    expect(styleUrlForTopoBaseLayer(layers)).toContain('topo-v2');
  });

  it('falls back to first layer when no role flags set', () => {
    const noDefault = layers.map((layer) =>
      MapBaseLayer.deserialize({
        ...MapBaseLayer.serialize(layer),
        topoDefault: false,
        rockExplorerDefault: false,
      }),
    );
    expect(pickTopoBaseLayerId(noDefault)).toBe('maptiler-topo');
    expect(pickRockExplorerDefaultBaseLayerId(noDefault)).toBe('maptiler-topo');
  });

  it('returns null when no layers configured', () => {
    expect(resolveMapBaseLayers([])).toEqual([]);
    expect(styleUrlForBaseLayer([], 'x')).toBeNull();
    expect(styleUrlForTopoBaseLayer([])).toBeNull();
  });
});
