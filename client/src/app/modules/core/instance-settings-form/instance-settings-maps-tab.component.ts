import { Component, Input, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { ButtonModule } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import {
  MapOverlayPaintMode,
  MapOverlaySourceKind,
  MapOverlayTileSize,
  MapOverlayType,
} from '../../../models/map-overlay';
import { FormEntryRowComponent } from '../../shared/components/form-entry-row/form-entry-row.component';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import {
  createBaseLayerGroup,
  createCategoricalStopGroup,
  createMapLayerGroup,
  createVectorLayerGroup,
  ensureBaseLayerRoleDefaults,
  overlaySelectOptions,
} from './instance-settings-maps-form';

type TileJsonAttributeInfo = {
  name: string;
  type?: string;
  values: string[];
  distinctCount?: number;
};

type TileJsonOverlayMeta = {
  loading: boolean;
  error: string | null;
  attributesBySourceLayer: Record<string, TileJsonAttributeInfo[]>;
};

@Component({
  selector: 'lc-instance-settings-maps-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ButtonModule,
    Checkbox,
    ColorPickerModule,
    InputNumberModule,
    InputTextModule,
    MultiSelect,
    Select,
    TooltipModule,
    FormEntryRowComponent,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './instance-settings-maps-tab.component.html',
  styleUrl: './instance-settings-maps-tab.component.scss',
})
export class InstanceSettingsMapsTabComponent implements OnInit {
  @Input({ required: true }) group!: FormGroup;
  @Input() loading = false;
  @Input({ required: true }) save!: () => void;

  public sourceKindOptions: {
    label: string;
    value: MapOverlaySourceKind;
  }[] = [];
  public overlayTypeOptions: {
    label: string;
    value: MapOverlayType;
  }[] = [];
  public paintModeOptions: {
    label: string;
    value: MapOverlayPaintMode;
  }[] = [];
  public tileSizeOptions: {
    label: string;
    value: MapOverlayTileSize;
  }[] = [
    { label: '256', value: 256 },
    { label: '512', value: 512 },
  ];
  /** TileJSON attribute cache keyed by overlay form index. */
  public tileJsonMetaByOverlay: Record<number, TileJsonOverlayMeta> = {};

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private translocoService = inject(TranslocoService);

  ngOnInit(): void {
    this.sourceKindOptions = [
      {
        label: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerSourceKindTilejson',
          ),
        ),
        value: 'tilejson',
      },
      {
        label: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerSourceKindTiles',
          ),
        ),
        value: 'tiles',
      },
    ];
    this.overlayTypeOptions = [
      {
        label: this.translocoService.translate(
          marker('instanceSettings.instanceSettingsForm.mapLayerTypeRaster'),
        ),
        value: 'raster',
      },
      {
        label: this.translocoService.translate(
          marker('instanceSettings.instanceSettingsForm.mapLayerTypeVector'),
        ),
        value: 'vector',
      },
    ];
    this.paintModeOptions = [
      {
        label: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerPaintModeSolid',
          ),
        ),
        value: 'solid',
      },
      {
        label: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerPaintModeCategorical',
          ),
        ),
        value: 'categorical',
      },
    ];
  }

  mapBaseLayersControls(): FormArray {
    return this.group.get('mapBaseLayers') as FormArray;
  }

  mapOverlaysControls(): FormArray {
    return this.group.get('mapOverlays') as FormArray;
  }

  overlaySelectOptions(): { label: string; value: string }[] {
    return overlaySelectOptions(this.mapOverlaysControls());
  }

  vectorLayersControls(overlayIndex: number): FormArray {
    return this.mapOverlaysControls()
      .at(overlayIndex)
      .get('layers') as FormArray;
  }

  categoricalStopsControls(
    overlayIndex: number,
    layerIndex: number,
  ): FormArray {
    return this.vectorLayersControls(overlayIndex)
      .at(layerIndex)
      .get('categoricalStops') as FormArray;
  }

  addBaseLayer(): void {
    const layers = this.mapBaseLayersControls();
    const isFirst = layers.length === 0;
    layers.push(
      createBaseLayerGroup(this.fb, {
        topoDefault: isFirst,
        rockExplorerDefault: isFirst,
      }),
    );
    ensureBaseLayerRoleDefaults(layers);
  }

  removeBaseLayer(index: number): void {
    this.mapBaseLayersControls().removeAt(index);
    ensureBaseLayerRoleDefaults(this.mapBaseLayersControls());
  }

  moveBaseLayer(index: number, direction: 'up' | 'down'): void {
    const layers = this.mapBaseLayersControls();
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= layers.length) {
      return;
    }
    const control = layers.at(index);
    layers.removeAt(index);
    layers.insert(target, control);
  }

  onBaseLayerRoleDefaultChange(
    index: number,
    role: 'topoDefault' | 'rockExplorerDefault',
    checked: boolean,
  ): void {
    const layers = this.mapBaseLayersControls();
    if (!checked) {
      const otherDefault = layers.controls.some(
        (group, i) => i !== index && group.get(role)?.value === true,
      );
      if (!otherDefault) {
        layers.at(index).get(role)?.setValue(true, { emitEvent: false });
        layers.updateValueAndValidity();
        return;
      }
      layers.at(index).get(role)?.setValue(false, { emitEvent: false });
      layers.updateValueAndValidity();
      return;
    }
    layers.controls.forEach((group, i) => {
      group.get(role)?.setValue(i === index, { emitEvent: false });
    });
    layers.updateValueAndValidity();
  }

  onOverlayTypeChange(overlayIndex: number): void {
    const group = this.mapOverlaysControls().at(overlayIndex);
    const layers = group.get('layers') as FormArray;
    if (group.get('type')?.value === 'vector' && layers.length === 0) {
      layers.push(createVectorLayerGroup(this.fb));
    }
    group.updateValueAndValidity();
  }

  addVectorLayer(overlayIndex: number): void {
    const layers = this.vectorLayersControls(overlayIndex);
    layers.push(createVectorLayerGroup(this.fb));
    this.mapOverlaysControls().at(overlayIndex).updateValueAndValidity();
  }

  removeVectorLayer(overlayIndex: number, layerIndex: number): void {
    const layers = this.vectorLayersControls(overlayIndex);
    layers.removeAt(layerIndex);
    this.mapOverlaysControls().at(overlayIndex).updateValueAndValidity();
  }

  moveVectorLayer(
    overlayIndex: number,
    layerIndex: number,
    direction: 'up' | 'down',
  ): void {
    const layers = this.vectorLayersControls(overlayIndex);
    const target = direction === 'up' ? layerIndex - 1 : layerIndex + 1;
    if (target < 0 || target >= layers.length) {
      return;
    }
    const control = layers.at(layerIndex);
    layers.removeAt(layerIndex);
    layers.insert(target, control);
    this.mapOverlaysControls().at(overlayIndex).updateValueAndValidity();
  }

  addMapLayer(): void {
    this.mapOverlaysControls().push(createMapLayerGroup(this.fb));
  }

  removeMapLayer(index: number): void {
    this.mapOverlaysControls().removeAt(index);
    this.pruneBaseLayerOverlaySelections();
  }

  moveMapLayer(index: number, direction: 'up' | 'down'): void {
    const layers = this.mapOverlaysControls();
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= layers.length) {
      return;
    }
    const control = layers.at(index);
    layers.removeAt(index);
    layers.insert(target, control);
  }

  onVectorPaintModeChange(overlayIndex: number, layerIndex: number): void {
    const group = this.vectorLayersControls(overlayIndex).at(layerIndex);
    group.updateValueAndValidity();
    this.mapOverlaysControls().at(overlayIndex).updateValueAndValidity();
  }

  addCategoricalStop(overlayIndex: number, layerIndex: number): void {
    const stops = this.categoricalStopsControls(overlayIndex, layerIndex);
    stops.push(
      createCategoricalStopGroup(this.fb, {
        color: this.paletteColor(stops.length, stops.length + 1),
      }),
    );
    this.vectorLayersControls(overlayIndex)
      .at(layerIndex)
      .updateValueAndValidity();
  }

  removeCategoricalStop(
    overlayIndex: number,
    layerIndex: number,
    stopIndex: number,
  ): void {
    const stops = this.categoricalStopsControls(overlayIndex, layerIndex);
    stops.removeAt(stopIndex);
    this.vectorLayersControls(overlayIndex)
      .at(layerIndex)
      .updateValueAndValidity();
  }

  tileJsonAttributeOptions(
    overlayIndex: number,
    layerIndex: number,
  ): { label: string; value: string }[] {
    const sourceLayer = String(
      this.vectorLayersControls(overlayIndex).at(layerIndex).get('sourceLayer')
        ?.value ?? '',
    ).trim();
    const meta = this.tileJsonMetaByOverlay[overlayIndex];
    const attrs = meta?.attributesBySourceLayer?.[sourceLayer] ?? [];
    return attrs.map((attr) => ({
      label:
        attr.distinctCount != null
          ? `${attr.name} (${attr.distinctCount})`
          : attr.name,
      value: attr.name,
    }));
  }

  loadTileJsonAttributes(overlayIndex: number): void {
    const group = this.mapOverlaysControls().at(overlayIndex);
    if (group.get('sourceKind')?.value !== 'tilejson') {
      this.tileJsonMetaByOverlay[overlayIndex] = {
        loading: false,
        error: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerTileJsonRequiresTilejson',
          ),
        ),
        attributesBySourceLayer: {},
      };
      return;
    }
    const url = String(group.get('url')?.value ?? '').trim();
    if (!url) {
      this.tileJsonMetaByOverlay[overlayIndex] = {
        loading: false,
        error: this.translocoService.translate(
          marker(
            'instanceSettings.instanceSettingsForm.mapLayerTileJsonUrlRequired',
          ),
        ),
        attributesBySourceLayer: {},
      };
      return;
    }
    this.tileJsonMetaByOverlay[overlayIndex] = {
      loading: true,
      error: null,
      attributesBySourceLayer: {},
    };
    this.http.get<Record<string, unknown>>(url).subscribe({
      next: (tileJson) => {
        this.tileJsonMetaByOverlay[overlayIndex] = {
          loading: false,
          error: null,
          attributesBySourceLayer: this.parseTileJsonAttributes(tileJson),
        };
      },
      error: () => {
        this.tileJsonMetaByOverlay[overlayIndex] = {
          loading: false,
          error: this.translocoService.translate(
            marker(
              'instanceSettings.instanceSettingsForm.mapLayerTileJsonLoadError',
            ),
          ),
          attributesBySourceLayer: {},
        };
      },
    });
  }

  seedCategoricalStopsFromTileJson(
    overlayIndex: number,
    layerIndex: number,
  ): void {
    const group = this.vectorLayersControls(overlayIndex).at(layerIndex);
    const sourceLayer = String(group.get('sourceLayer')?.value ?? '').trim();
    const property = String(
      group.get('categoricalProperty')?.value ?? '',
    ).trim();
    if (!sourceLayer || !property) {
      return;
    }
    const meta = this.tileJsonMetaByOverlay[overlayIndex];
    const attr = (meta?.attributesBySourceLayer?.[sourceLayer] ?? []).find(
      (item) => item.name === property,
    );
    const values = attr?.values ?? [];
    if (values.length === 0) {
      return;
    }
    const stops = this.categoricalStopsControls(overlayIndex, layerIndex);
    stops.clear();
    values.forEach((value, index) => {
      stops.push(
        createCategoricalStopGroup(this.fb, {
          value,
          color: this.paletteColor(index, values.length),
        }),
      );
    });
    group.updateValueAndValidity();
  }

  private pruneBaseLayerOverlaySelections(): void {
    const validIds = new Set(
      this.overlaySelectOptions().map((option) => option.value),
    );
    for (const group of this.mapBaseLayersControls().controls) {
      const control = group.get('defaultOverlayIds');
      const current = (control?.value ?? []) as string[];
      const next = current.filter((id) => validIds.has(id));
      if (next.length !== current.length) {
        control?.setValue(next, { emitEvent: false });
      }
    }
  }

  private parseTileJsonAttributes(
    tileJson: Record<string, unknown>,
  ): Record<string, TileJsonAttributeInfo[]> {
    const result: Record<string, TileJsonAttributeInfo[]> = {};
    const vectorLayers = Array.isArray(tileJson?.['vector_layers'])
      ? (tileJson['vector_layers'] as Record<string, unknown>[])
      : [];
    const tilestatsLayers = Array.isArray(
      (tileJson?.['tilestats'] as Record<string, unknown> | undefined)?.[
        'layers'
      ],
    )
      ? ((tileJson['tilestats'] as Record<string, unknown>)['layers'] as Record<
          string,
          unknown
        >[])
      : [];
    const statsByLayer = new Map<string, Record<string, unknown>[]>();
    for (const layer of tilestatsLayers) {
      const id = String(layer?.['layer'] ?? '').trim();
      if (!id) {
        continue;
      }
      const attrs = Array.isArray(layer?.['attributes'])
        ? (layer['attributes'] as Record<string, unknown>[])
        : [];
      statsByLayer.set(id, attrs);
    }
    for (const layer of vectorLayers) {
      const id = String(layer?.['id'] ?? '').trim();
      if (!id) {
        continue;
      }
      const fields =
        layer?.['fields'] && typeof layer['fields'] === 'object'
          ? (layer['fields'] as Record<string, unknown>)
          : {};
      const stats = statsByLayer.get(id) ?? [];
      const attrs: TileJsonAttributeInfo[] = Object.keys(fields).map((name) => {
        const stat = stats.find(
          (item) => String(item?.['attribute'] ?? '') === name,
        );
        const rawValues = Array.isArray(stat?.['values'])
          ? (stat['values'] as unknown[])
          : [];
        const values = rawValues
          .map((value) => String(value ?? '').trim())
          .filter((value) => value.length > 0);
        const distinctCount =
          typeof stat?.['count'] === 'number'
            ? (stat['count'] as number)
            : values.length || undefined;
        return {
          name,
          type: String(fields[name] ?? stat?.['type'] ?? ''),
          values,
          distinctCount,
        };
      });
      attrs.sort(
        (a, b) => (a.distinctCount ?? 9999) - (b.distinctCount ?? 9999),
      );
      result[id] = attrs;
    }
    return result;
  }

  private paletteColor(index: number, total: number): string {
    const n = Math.max(total, 1);
    const hue = Math.round((360 * index) / n);
    return this.hslToHex(hue, 62, 42);
  }

  private hslToHex(h: number, s: number, l: number): string {
    const sat = s / 100;
    const light = l / 100;
    const c = (1 - Math.abs(2 * light - 1)) * sat;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = light - c / 2;
    let r = 0;
    let g = 0;
    let b = 0;
    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }
    const toHex = (channel: number) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}
