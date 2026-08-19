import {
  Component,
  OnInit,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { EditorModule } from 'primeng/editor';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError, switchMap } from 'rxjs/operators';
import { EMPTY, of, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import {
  InstanceSettings,
  type InstanceSettingsPatch,
} from '../../../models/instance-settings';
import { MapBaseLayer } from '../../../models/map-base-layer';
import {
  MapOverlay,
  MapOverlayCategoricalStop,
  MapOverlayPaintMode,
  MapOverlaySourceKind,
  MapOverlayTileSize,
  MapOverlayType,
  MapOverlayVectorLayer,
} from '../../../models/map-overlay';
import { InstanceSettingsService } from '../../../services/crud/instance-settings.service';
import { UploadService } from '../../../services/crud/upload.service';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { PaginatorModule } from 'primeng/paginator';
import { updateInstanceSettings } from '../../../ngrx/actions/instance-settings.actions';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DividerModule } from 'primeng/divider';
import { getRgbObject } from '../../../utility/misc/color';
import { TooltipModule } from 'primeng/tooltip';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { FaDefaultFormat } from '../../../enums/fa-default-format';
import { StartingPosition } from '../../../enums/starting-position';
import { getInstanceTimezoneOptions } from '../../../utility/constants/instance-timezones';
import { PageTitleService } from '../../../services/core/page-title.service';
import { httpUrlValidator } from '../../../utility/validators/http-url.validator';
import { HttpClient } from '@angular/common/http';
import { InstanceSettingsGeneralTabComponent } from './instance-settings-general-tab.component';
import { InstanceSettingsAppearanceTabComponent } from './instance-settings-appearance-tab.component';
import { InstanceSettingsAnalyticsTabComponent } from './instance-settings-analytics-tab.component';
import { InstanceSettingsMapsTabComponent } from './instance-settings-maps-tab.component';

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

type SettingsTabId = 'general' | 'appearance' | 'analytics' | 'maps';

const MAX_CATEGORICAL_STOPS = 200;

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

@Component({
  selector: 'lc-instance-settings-form',
  imports: [
    ButtonModule,
    ConfirmPopupModule,
    EditorModule,
    InputTextModule,
    InputNumberModule,
    PaginatorModule,
    ReactiveFormsModule,
    TranslocoDirective,
    ColorPickerModule,
    DividerModule,
    TooltipModule,
    Tabs,
    TabList,
    Tab,
    FormDirective,
    InstanceSettingsGeneralTabComponent,
    InstanceSettingsAppearanceTabComponent,
    InstanceSettingsAnalyticsTabComponent,
    InstanceSettingsMapsTabComponent,
  ],
  templateUrl: './instance-settings-form.component.html',
  styleUrl: './instance-settings-form.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class InstanceSettingsFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public instanceSettingsForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public instanceSettings: InstanceSettings;
  public faDefaultFormats = FaDefaultFormat;
  public startingPositions = [
    StartingPosition.STAND,
    StartingPosition.SIT,
    StartingPosition.CROUCH,
    StartingPosition.LAYDOWN,
    StartingPosition.FRENCH,
    StartingPosition.CANDLE,
  ];
  public startingPositionsOptions: {
    label: string;
    value: StartingPosition;
  }[] = [];
  public rankingPastWeeksOptions: { label: string; value: number | null }[] =
    [];
  public timezoneOptions = getInstanceTimezoneOptions();
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
  public readonly maxMapLayers = 10;
  public readonly maxBaseLayers = 10;
  public readonly maxVectorLayersPerOverlay = 20;
  public readonly maxCategoricalStops = MAX_CATEGORICAL_STOPS;
  /** TileJSON attribute cache keyed by overlay form index. */
  public tileJsonMetaByOverlay: Record<number, TileJsonOverlayMeta> = {};
  public activeTab: SettingsTabId = 'general';
  public saveGeneralTab = () => this.saveTab('general');
  public saveAppearanceTab = () => this.saveTab('appearance');
  public saveAnalyticsTab = () => this.saveTab('analytics');
  public saveMapsTab = () => this.saveTab('maps');

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);
  private instanceSettingsService = inject(InstanceSettingsService);
  private uploadService = inject(UploadService);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);
  private http = inject(HttpClient);

  ngOnInit() {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        marker('instanceSettings.instanceSettingsForm.editInstanceSettings'),
      ),
    );
    this.buildForm();
    // build translated options for starting positions
    this.startingPositionsOptions = this.startingPositions.map((sp) => ({
      label: this.translocoService.translate(sp),
      value: sp,
    }));
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

    // build options for rankingPastWeeks
    this.rankingPastWeeksOptions = [
      {
        label: this.translocoService.translate(
          'instanceSettings.instanceSettingsForm.rankingPastWeeksAll',
        ),
        value: null,
      },
      ...Array.from({ length: 20 }, (_, i) => i + 1).map((w) => ({
        label:
          w === 1
            ? this.translocoService.translate(
                'instanceSettings.instanceSettingsForm.rankingPastWeeksWeek',
              )
            : this.translocoService.translate(
                'instanceSettings.instanceSettingsForm.rankingPastWeeksWeeks',
                { weeks: w },
              ),
        value: w,
      })),
    ];

    this.instanceSettingsForm.disable();
    this.instanceSettingsService
      .getInstanceSettings()
      .pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
            return EMPTY;
          }
          return throwError(() => e);
        }),
      )
      .subscribe((instanceSettings) => {
        this.instanceSettings = instanceSettings;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
      });
  }

  mapBaseLayersControls(): FormArray {
    return this.instanceSettingsForm.get('maps.mapBaseLayers') as FormArray;
  }

  mapOverlaysControls(): FormArray {
    return this.instanceSettingsForm.get('maps.mapOverlays') as FormArray;
  }

  generalGroup(): FormGroup {
    return this.instanceSettingsForm.get('general') as FormGroup;
  }

  appearanceGroup(): FormGroup {
    return this.instanceSettingsForm.get('appearance') as FormGroup;
  }

  analyticsGroup(): FormGroup {
    return this.instanceSettingsForm.get('analytics') as FormGroup;
  }

  mapsGroup(): FormGroup {
    return this.instanceSettingsForm.get('maps') as FormGroup;
  }

  /** Overlay options for the base-layer default-overlays MultiSelect. */
  overlaySelectOptions(): { label: string; value: string }[] {
    return (this.mapOverlaysControls().getRawValue() ?? [])
      .filter((layer: { id?: string }) => !!layer?.id)
      .map((layer: { id: string; name?: string }) => ({
        value: layer.id,
        label: (layer.name && String(layer.name).trim()) || layer.id,
      }));
  }

  private createBaseLayerGroup(layer?: Partial<MapBaseLayer>): FormGroup {
    return this.fb.group({
      id: [layer?.id ?? crypto.randomUUID()],
      name: [
        layer?.name ?? '',
        [Validators.required, Validators.maxLength(120)],
      ],
      styleUrl: [
        layer?.styleUrl ?? '',
        [Validators.required, Validators.maxLength(2048), httpUrlValidator()],
      ],
      topoDefault: [layer?.topoDefault === true],
      rockExplorerDefault: [layer?.rockExplorerDefault === true],
      defaultOverlayIds: [layer?.defaultOverlayIds ?? []],
    });
  }

  addBaseLayer(): void {
    if (this.mapBaseLayersControls().length >= this.maxBaseLayers) {
      return;
    }
    const layers = this.mapBaseLayersControls();
    const isFirst = layers.length === 0;
    layers.push(
      this.createBaseLayerGroup({
        topoDefault: isFirst,
        rockExplorerDefault: isFirst,
      }),
    );
    this.ensureBaseLayerRoleDefaults();
  }

  removeBaseLayer(index: number): void {
    this.mapBaseLayersControls().removeAt(index);
    this.ensureBaseLayerRoleDefaults();
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

  /**
   * Exclusive checkbox for a role (`topoDefault` / `rockExplorerDefault`).
   * Refuses to clear the last checked layer for that role.
   */
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

  /** Ensures each role has a selected base layer when the list is non-empty. */
  private ensureBaseLayerRoleDefaults(): void {
    const layers = this.mapBaseLayersControls();
    if (!layers.length) {
      layers.updateValueAndValidity();
      return;
    }
    for (const role of ['topoDefault', 'rockExplorerDefault'] as const) {
      const hasRole = layers.controls.some(
        (group) => group.get(role)?.value === true,
      );
      if (!hasRole) {
        layers.at(0).get(role)?.setValue(true, { emitEvent: false });
      }
    }
    layers.updateValueAndValidity();
  }

  /** Drops overlay ids from base-layer defaults when the overlay was removed. */
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

  private createMapLayerGroup(layer?: Partial<MapOverlay>): FormGroup {
    const type = layer?.type === 'vector' ? 'vector' : 'raster';
    const vectorLayers = this.fb.array(
      (layer?.layers?.length
        ? layer.layers
        : type === 'vector'
          ? [MapOverlayVectorLayer.deserialize({})]
          : []
      ).map((item) => this.createVectorLayerGroup(item)),
    );
    return this.fb.group(
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

  private createVectorLayerGroup(
    layer?: Partial<MapOverlayVectorLayer>,
  ): FormGroup {
    const paintMode: MapOverlayPaintMode =
      layer?.paintMode === 'categorical' ? 'categorical' : 'solid';
    return this.fb.group(
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
        categoricalStops: this.fb.array(
          (layer?.categoricalStops ?? []).map((stop) =>
            this.createCategoricalStopGroup(stop),
          ),
        ),
        defaultActive: [layer?.defaultActive !== false],
      },
      { validators: [vectorLayerPaintValidator] },
    );
  }

  private createCategoricalStopGroup(
    stop?: Partial<MapOverlayCategoricalStop>,
  ): FormGroup {
    return this.fb.group({
      value: [
        stop?.value ?? '',
        [Validators.required, Validators.maxLength(500)],
      ],
      color: [stop?.color ?? '#2d6a4f', [Validators.required]],
    });
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

  onVectorPaintModeChange(overlayIndex: number, layerIndex: number): void {
    const group = this.vectorLayersControls(overlayIndex).at(layerIndex);
    group.updateValueAndValidity();
    this.mapOverlaysControls().at(overlayIndex).updateValueAndValidity();
  }

  addCategoricalStop(overlayIndex: number, layerIndex: number): void {
    const stops = this.categoricalStopsControls(overlayIndex, layerIndex);
    if (stops.length >= this.maxCategoricalStops) {
      return;
    }
    stops.push(
      this.createCategoricalStopGroup({
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
    const limited = values.slice(0, this.maxCategoricalStops);
    const stops = this.categoricalStopsControls(overlayIndex, layerIndex);
    stops.clear();
    limited.forEach((value, index) => {
      stops.push(
        this.createCategoricalStopGroup({
          value,
          color: this.paletteColor(index, limited.length),
        }),
      );
    });
    group.updateValueAndValidity();
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
      // Prefer lower-cardinality attributes first for the picker.
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
    const saturation = 62;
    const lightness = 42;
    return this.hslToHex(hue, saturation, lightness);
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

  onOverlayTypeChange(overlayIndex: number): void {
    const group = this.mapOverlaysControls().at(overlayIndex);
    const layers = group.get('layers') as FormArray;
    if (group.get('type')?.value === 'vector' && layers.length === 0) {
      layers.push(this.createVectorLayerGroup());
    }
    group.updateValueAndValidity();
  }

  addVectorLayer(overlayIndex: number): void {
    const layers = this.vectorLayersControls(overlayIndex);
    if (layers.length >= this.maxVectorLayersPerOverlay) {
      return;
    }
    layers.push(this.createVectorLayerGroup());
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
    if (this.mapOverlaysControls().length >= this.maxMapLayers) {
      return;
    }
    this.mapOverlaysControls().push(this.createMapLayerGroup());
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

  private buildForm() {
    this.instanceSettingsForm = this.fb.group({
      general: this.fb.group({
        instanceName: [null, [Validators.required, Validators.maxLength(120)]],
        copyrightOwner: [
          null,
          [Validators.required, Validators.maxLength(120)],
        ],
        mailGreeting: [null, [Validators.required, Validators.maxLength(120)]],
        gymMode: [null],
        skippedHierarchicalLayers: [null],
        displayUserGrades: [null],
        displayUserRatings: [null],
        faDefaultFormat: [null],
        defaultStartingPosition: [null, [Validators.required]],
        rankingPastWeeks: [null],
        language: [null],
        timezone: [null, [Validators.required]],
      }),
      appearance: this.fb.group({
        logoImage: [null],
        darkLogoImage: [null],
        faviconImage: [null],
        bgImage: [null],
        arrowColor: [null],
        arrowTextColor: [null],
        arrowHighlightColor: [null],
        arrowHighlightTextColor: [null],
        barChartColor: [null],
        barChartAccentColor: [null],
        darkBarChartColor: [null],
        darkBarChartAccentColor: [null],
      }),
      analytics: this.fb.group({
        matomoTrackerUrl: [null, [Validators.maxLength(120)]],
        matomoSiteId: [null, [Validators.maxLength(120)]],
      }),
      maps: this.fb.group({
        mapBaseLayers: this.fb.array([], {
          validators: [baseLayersDefaultValidator],
        }),
        mapOverlays: this.fb.array([]),
      }),
    });
  }

  private setFormValue() {
    this.instanceSettingsForm.enable();
    const baseLayersArray = this.mapBaseLayersControls();
    baseLayersArray.clear();
    (this.instanceSettings.mapBaseLayers ?? []).forEach((layer) => {
      baseLayersArray.push(this.createBaseLayerGroup(layer));
    });
    this.ensureBaseLayerRoleDefaults();
    const layersArray = this.mapOverlaysControls();
    layersArray.clear();
    (this.instanceSettings.mapOverlays ?? []).forEach((layer) => {
      layersArray.push(this.createMapLayerGroup(layer));
    });
    this.instanceSettingsForm.patchValue({
      general: {
        instanceName: this.instanceSettings.instanceName,
        copyrightOwner: this.instanceSettings.copyrightOwner,
        mailGreeting: this.instanceSettings.mailGreeting,
        gymMode: this.instanceSettings.gymMode,
        skippedHierarchicalLayers:
          this.instanceSettings.skippedHierarchicalLayers,
        displayUserGrades: this.instanceSettings.displayUserGrades,
        displayUserRatings: this.instanceSettings.displayUserRatings,
        faDefaultFormat: this.instanceSettings.faDefaultFormat,
        defaultStartingPosition: this.instanceSettings.defaultStartingPosition,
        rankingPastWeeks: this.instanceSettings.rankingPastWeeks,
        language: this.instanceSettings.language,
        timezone: this.instanceSettings.timezone,
      },
      appearance: {
        logoImage: this.instanceSettings.logoImage,
        darkLogoImage: this.instanceSettings.darkLogoImage,
        faviconImage: this.instanceSettings.faviconImage,
        bgImage: this.instanceSettings.bgImage,
        arrowColor: this.instanceSettings.arrowColor,
        arrowTextColor: this.instanceSettings.arrowTextColor,
        arrowHighlightColor: this.instanceSettings.arrowHighlightColor,
        arrowHighlightTextColor: this.instanceSettings.arrowHighlightTextColor,
        barChartColor: getRgbObject(this.instanceSettings.barChartColor),
        barChartAccentColor: getRgbObject(
          this.instanceSettings.barChartAccentColor,
        ),
        darkBarChartColor: getRgbObject(
          this.instanceSettings.darkBarChartColor,
        ),
        darkBarChartAccentColor: getRgbObject(
          this.instanceSettings.darkBarChartAccentColor,
        ),
      },
      analytics: {
        matomoSiteId: this.instanceSettings.matomoSiteId,
        matomoTrackerUrl: this.instanceSettings.matomoTrackerUrl,
      },
    });
  }

  public saveTab(tab: SettingsTabId) {
    const group = this.instanceSettingsForm.get(tab) as FormGroup | null;
    if (!group) {
      return;
    }
    if (!group.valid) {
      group.markAllAsTouched();
      return;
    }

    this.loadingState = LoadingState.LOADING;
    const patch = this.buildPatchForTab(tab);
    const appearance = this.appearanceGroup().getRawValue();
    const preflight$ =
      tab === 'appearance'
        ? this.uploadService.saveFileFocusIfChanged(appearance.bgImage)
        : of(null);

    preflight$
      .pipe(
        switchMap(() =>
          this.instanceSettingsService.patchInstanceSettings(patch),
        ),
      )
      .subscribe({
        next: (instanceSettings) => {
          this.store.dispatch(toastNotification('INSTANCE_SETTINGS_UPDATED'));
          this.loadingState = LoadingState.DEFAULT;
          this.instanceSettings = instanceSettings;
          this.setFormValue();
          this.store.dispatch(
            updateInstanceSettings({ settings: instanceSettings }),
          );
        },
        error: (e) => {
          this.loadingState = LoadingState.DEFAULT;
          if (e.error?.message == 'MIGRATION_IMPOSSIBLE') {
            this.store.dispatch(
              toastNotification('INSTANCE_SETTINGS_ERROR_MIGRATION_IMPOSSIBLE'),
            );
          } else {
            this.store.dispatch(toastNotification('UNKNOWN_ERROR'));
          }
        },
      });
  }

  private buildPatchForTab(tab: SettingsTabId): InstanceSettingsPatch {
    if (tab === 'general') {
      return InstanceSettings.serializeGeneralPatch(
        this.generalGroup().getRawValue(),
      );
    }
    if (tab === 'appearance') {
      const raw = this.appearanceGroup().getRawValue();
      return InstanceSettings.serializeAppearancePatch({
        ...raw,
        barChartColor: this.getCSSRgbValue(raw.barChartColor),
        barChartAccentColor: this.getCSSRgbValue(raw.barChartAccentColor),
        darkBarChartColor: this.getCSSRgbValue(raw.darkBarChartColor),
        darkBarChartAccentColor: this.getCSSRgbValue(
          raw.darkBarChartAccentColor,
        ),
      });
    }
    if (tab === 'analytics') {
      return InstanceSettings.serializeAnalyticsPatch(
        this.analyticsGroup().getRawValue(),
      );
    }
    return InstanceSettings.serializeMapsPatch({
      mapBaseLayers: (this.mapBaseLayersControls().getRawValue() ?? []).map(
        (layer) => {
          const validOverlayIds = new Set(
            this.overlaySelectOptions().map((option) => option.value),
          );
          return MapBaseLayer.deserialize({
            ...layer,
            defaultOverlayIds: (layer.defaultOverlayIds ?? []).filter(
              (id: string) => validOverlayIds.has(id),
            ),
          });
        },
      ),
      mapOverlays: (this.mapOverlaysControls().getRawValue() ?? []).map(
        (layer) => MapOverlay.deserialize(layer),
      ),
    });
  }

  private getCSSRgbValue(raw: any): string {
    return `rgb(${raw.r}, ${raw.g}, ${raw.b})`;
  }
}
