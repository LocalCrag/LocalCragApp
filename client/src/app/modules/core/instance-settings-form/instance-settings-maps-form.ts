import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MapBaseLayer } from '../../../models/map-base-layer';
import {
  MapOverlay,
  MapOverlayCategoricalStop,
  MapOverlayPaintMode,
  MapOverlayVectorLayer,
} from '../../../models/map-overlay';
import { httpUrlValidator } from '../../../utility/validators/http-url.validator';

const tilesUrlTemplateValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  const sourceKind = group.get('sourceKind')?.value;
  const url = group.get('url')?.value as string | null;
  if (sourceKind !== 'tiles' || !url) {
    return null;
  }
  if (!url.includes('{z}') || !url.includes('{x}') || !url.includes('{y}')) {
    return { tilesUrlMissingPlaceholders: true };
  }
  return null;
};

const mapOverlayTypeValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  if (group.get('type')?.value !== 'vector') {
    return null;
  }
  const layers = group.get('layers') as FormArray | null;
  const entries = layers?.controls ?? [];
  if (entries.length === 0) {
    return { vectorLayersRequired: true };
  }
  const names = entries
    .map((control) => String(control.get('sourceLayer')?.value ?? '').trim())
    .filter((name) => name.length > 0);
  if (names.length === 0) {
    return { vectorLayersRequired: true };
  }
  if (new Set(names).size !== names.length) {
    return { vectorLayersDuplicate: true };
  }
  return null;
};

const vectorLayerPaintValidator: ValidatorFn = (
  group: AbstractControl,
): ValidationErrors | null => {
  if (group.get('paintMode')?.value !== 'categorical') {
    return null;
  }
  const property = String(group.get('categoricalProperty')?.value ?? '').trim();
  if (!property) {
    return { categoricalPropertyRequired: true };
  }
  const stops = group.get('categoricalStops') as FormArray | null;
  if (!stops?.length) {
    return { categoricalStopsRequired: true };
  }
  const values = stops.controls
    .map((control) => String(control.get('value')?.value ?? '').trim())
    .filter((value) => value.length > 0);
  if (values.length === 0) {
    return { categoricalStopsRequired: true };
  }
  if (new Set(values).size !== values.length) {
    return { categoricalStopsDuplicate: true };
  }
  return null;
};

/** Non-empty base-layer lists must mark one topo and one Rock Explorer default. */
const baseLayersDefaultValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const layers = control as FormArray;
  if (!layers?.length) {
    return null;
  }
  const hasTopo = layers.controls.some(
    (group) => group.get('topoDefault')?.value === true,
  );
  const hasRockExplorer = layers.controls.some(
    (group) => group.get('rockExplorerDefault')?.value === true,
  );
  if (!hasTopo && !hasRockExplorer) {
    return { baseLayerDefaultsRequired: true };
  }
  if (!hasTopo) {
    return { baseLayerTopoDefaultRequired: true };
  }
  if (!hasRockExplorer) {
    return { baseLayerRockExplorerDefaultRequired: true };
  }
  return null;
};

function createCategoricalStopGroup(
  fb: FormBuilder,
  stop?: Partial<MapOverlayCategoricalStop>,
): FormGroup {
  return fb.group({
    value: [
      stop?.value ?? '',
      [Validators.required, Validators.maxLength(500)],
    ],
    color: [stop?.color ?? '#2d6a4f', [Validators.required]],
  });
}

function createVectorLayerGroup(
  fb: FormBuilder,
  layer?: Partial<MapOverlayVectorLayer>,
): FormGroup {
  const paintMode: MapOverlayPaintMode =
    layer?.paintMode === 'categorical' ? 'categorical' : 'solid';
  return fb.group(
    {
      name: [
        layer?.name ?? '',
        [Validators.required, Validators.maxLength(120)],
      ],
      sourceLayer: [
        layer?.sourceLayer ?? '',
        [Validators.required, Validators.maxLength(120)],
      ],
      paintMode: [paintMode, [Validators.required]],
      color: [layer?.color ?? '#2d6a4f', [Validators.required]],
      categoricalProperty: [
        layer?.categoricalProperty ?? '',
        [Validators.maxLength(120)],
      ],
      categoricalStops: fb.array(
        (layer?.categoricalStops ?? []).map((stop) =>
          createCategoricalStopGroup(fb, stop),
        ),
      ),
      defaultActive: [layer?.defaultActive !== false],
    },
    { validators: [vectorLayerPaintValidator] },
  );
}

function createMapLayerGroup(
  fb: FormBuilder,
  layer?: Partial<MapOverlay>,
): FormGroup {
  const type = layer?.type === 'vector' ? 'vector' : 'raster';
  const vectorLayers = fb.array(
    (layer?.layers?.length
      ? layer.layers
      : type === 'vector'
        ? [MapOverlayVectorLayer.deserialize({})]
        : []
    ).map((item) => createVectorLayerGroup(fb, item)),
  );
  return fb.group(
    {
      id: [layer?.id ?? crypto.randomUUID()],
      name: [
        layer?.name ?? '',
        [Validators.required, Validators.maxLength(120)],
      ],
      type: [type, [Validators.required]],
      sourceKind: [layer?.sourceKind ?? 'tilejson', [Validators.required]],
      url: [
        layer?.url ?? '',
        [Validators.required, Validators.maxLength(2048), httpUrlValidator()],
      ],
      opacity: [
        layer?.opacity ?? 0.5,
        [Validators.required, Validators.min(0), Validators.max(1)],
      ],
      tileSize: [layer?.tileSize ?? 256, [Validators.required]],
      layers: vectorLayers,
    },
    { validators: [tilesUrlTemplateValidator, mapOverlayTypeValidator] },
  );
}

function createBaseLayerGroup(
  fb: FormBuilder,
  layer?: Partial<MapBaseLayer>,
): FormGroup {
  return fb.group({
    id: [layer?.id ?? crypto.randomUUID()],
    name: [layer?.name ?? '', [Validators.required, Validators.maxLength(120)]],
    styleUrl: [
      layer?.styleUrl ?? '',
      [Validators.required, Validators.maxLength(2048), httpUrlValidator()],
    ],
    topoDefault: [layer?.topoDefault === true],
    rockExplorerDefault: [layer?.rockExplorerDefault === true],
    defaultOverlayIds: [layer?.defaultOverlayIds ?? []],
  });
}

function ensureBaseLayerRoleDefaults(baseLayers: FormArray): void {
  if (!baseLayers.length) {
    baseLayers.updateValueAndValidity();
    return;
  }
  for (const role of ['topoDefault', 'rockExplorerDefault'] as const) {
    const hasRole = baseLayers.controls.some(
      (group) => group.get(role)?.value === true,
    );
    if (!hasRole) {
      baseLayers.at(0).get(role)?.setValue(true, { emitEvent: false });
    }
  }
  baseLayers.updateValueAndValidity();
}

function overlaySelectOptions(
  mapOverlays: FormArray,
): { label: string; value: string }[] {
  return (mapOverlays.getRawValue() ?? [])
    .filter((layer: { id?: string }) => !!layer?.id)
    .map((layer: { id: string; name?: string }) => ({
      value: layer.id,
      label: (layer.name && String(layer.name).trim()) || layer.id,
    }));
}

export function createMapsFormGroup(fb: FormBuilder): FormGroup {
  return fb.group({
    mapBaseLayers: fb.array([], {
      validators: [baseLayersDefaultValidator],
    }),
    mapOverlays: fb.array([]),
  });
}

export function populateMapsFormGroup(
  fb: FormBuilder,
  group: FormGroup,
  settings: {
    mapBaseLayers?: MapBaseLayer[];
    mapOverlays?: MapOverlay[];
  },
): void {
  const baseLayersArray = group.get('mapBaseLayers') as FormArray;
  baseLayersArray.clear();
  (settings.mapBaseLayers ?? []).forEach((layer) => {
    baseLayersArray.push(createBaseLayerGroup(fb, layer));
  });
  ensureBaseLayerRoleDefaults(baseLayersArray);

  const overlaysArray = group.get('mapOverlays') as FormArray;
  overlaysArray.clear();
  (settings.mapOverlays ?? []).forEach((layer) => {
    overlaysArray.push(createMapLayerGroup(fb, layer));
  });
}

export function serializeMapsFormGroup(group: FormGroup): {
  mapBaseLayers: MapBaseLayer[];
  mapOverlays: MapOverlay[];
} {
  const mapOverlays = group.get('mapOverlays') as FormArray;
  const mapBaseLayers = group.get('mapBaseLayers') as FormArray;
  const validOverlayIds = new Set(
    overlaySelectOptions(mapOverlays).map((option) => option.value),
  );
  return {
    mapBaseLayers: (mapBaseLayers.getRawValue() ?? []).map((layer) =>
      MapBaseLayer.deserialize({
        ...layer,
        defaultOverlayIds: (layer.defaultOverlayIds ?? []).filter(
          (id: string) => validOverlayIds.has(id),
        ),
      }),
    ),
    mapOverlays: (mapOverlays.getRawValue() ?? []).map((layer) =>
      MapOverlay.deserialize(layer),
    ),
  };
}

export {
  createBaseLayerGroup,
  createCategoricalStopGroup,
  createMapLayerGroup,
  createVectorLayerGroup,
  ensureBaseLayerRoleDefaults,
  overlaySelectOptions,
};
