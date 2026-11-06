import { FormArray, FormBuilder } from '@angular/forms';
import { MapOverlayVectorLayer } from '../../../models/map-overlay';
import {
  createBaseLayerGroup,
  createMapLayerGroup,
  createMapsFormGroup,
  createVectorLayerGroup,
} from './instance-settings-maps-form';

describe('maps form arrays', () => {
  const fb = new FormBuilder();

  it('requires a topo and a Rock Explorer default on the base-layer array', () => {
    const baseLayers = createMapsFormGroup(fb).get(
      'mapBaseLayers',
    ) as FormArray;
    baseLayers.push(
      createBaseLayerGroup(fb, {
        name: 'A',
        styleUrl: 'https://example.com/a.json',
      }),
    );
    baseLayers.push(
      createBaseLayerGroup(fb, {
        name: 'B',
        styleUrl: 'https://example.com/b.json',
        topoDefault: true,
      }),
    );

    expect(baseLayers.hasError('baseLayerDefaultsRequired')).toBeFalse();
    expect(
      baseLayers.hasError('baseLayerRockExplorerDefaultRequired'),
    ).toBeTrue();
  });

  it('puts vector source-layer rules on the layers array', () => {
    const missingName = createMapLayerGroup(fb, {
      type: 'vector',
      layers: [{ sourceLayer: '' } as MapOverlayVectorLayer],
    });
    expect(
      missingName.get('layers')?.hasError('vectorLayersRequired'),
    ).toBeTrue();

    const duplicate = createMapLayerGroup(fb, {
      type: 'vector',
      layers: [
        { sourceLayer: 'areas' } as MapOverlayVectorLayer,
        { sourceLayer: 'areas' } as MapOverlayVectorLayer,
      ],
    });
    expect(
      duplicate.get('layers')?.hasError('vectorLayersDuplicate'),
    ).toBeTrue();

    const raster = createMapLayerGroup(fb, {
      type: 'vector',
      layers: [{ sourceLayer: '' } as MapOverlayVectorLayer],
    });
    raster.get('type')?.setValue('raster');
    raster.get('layers')?.updateValueAndValidity();
    expect(raster.get('layers')?.errors).toBeNull();
  });

  it('puts categorical stop rules on the stops array', () => {
    const missing = createVectorLayerGroup(fb, {
      paintMode: 'categorical',
      categoricalProperty: 'AERA',
    });
    expect(
      missing.get('categoricalStops')?.hasError('categoricalStopsRequired'),
    ).toBeTrue();

    const duplicate = createVectorLayerGroup(fb, {
      paintMode: 'categorical',
      categoricalProperty: 'AERA',
      categoricalStops: [
        { value: 'forest', color: '#111111' },
        { value: 'forest', color: '#222222' },
      ],
    });
    expect(
      duplicate.get('categoricalStops')?.hasError('categoricalStopsDuplicate'),
    ).toBeTrue();

    const solid = createVectorLayerGroup(fb, { paintMode: 'solid' });
    expect(solid.get('categoricalStops')?.errors).toBeNull();
    solid.get('paintMode')?.setValue('categorical');
    solid.get('categoricalStops')?.updateValueAndValidity();
    expect(
      solid.get('categoricalStops')?.hasError('categoricalStopsRequired'),
    ).toBeTrue();
  });
});
