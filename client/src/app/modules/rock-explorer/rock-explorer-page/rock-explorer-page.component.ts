import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  GeolocateControl,
  GeoJSONSource,
  LngLatBounds,
  Map as MaplibreMap,
  MapMouseEvent,
  NavigationControl,
} from 'maplibre-gl';
import {
  Feature,
  FeatureCollection,
  Geometry,
  Polygon,
  Position,
} from 'geojson';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { MultiSelect } from 'primeng/multiselect';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Toast } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Store } from '@ngrx/store';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { MapStyles } from '../../../enums/map-styles';
import { RockExplorerService } from '../../../services/crud/rock-explorer.service';
import { RockExplorerFeature } from '../../../models/rock-explorer-feature';
import { RockExplorerCluster } from '../../../models/rock-explorer-cluster';
import { RockExplorerPotential } from '../../../enums/rock-explorer-potential';
import { RockExplorerRockQuality } from '../../../enums/rock-explorer-rock-quality';
import { RockExplorerRockType } from '../../../enums/rock-explorer-rock-type';
import { RockExplorerAccessIssue } from '../../../enums/rock-explorer-access-issue';
import { LineType } from '../../../enums/line-type';
import { computeClusterHulls } from '../../../utility/rock-explorer-hull';

type DrawMode = 'select' | 'point' | 'polygon';

@Component({
  selector: 'lc-rock-explorer-page',
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    MultiSelect,
    InputText,
    Textarea,
    Toast,
    ConfirmDialog,
    TranslocoDirective,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './rock-explorer-page.component.html',
  styleUrl: './rock-explorer-page.component.scss',
})
export class RockExplorerPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map') private mapContainer?: ElementRef<HTMLElement>;

  public mapStyle: MapStyles = MapStyles.TOPO;
  public readonly MapStyles = MapStyles;
  public drawMode: DrawMode = 'select';
  public showFilters = false;
  public panelOpen = false;
  public panelMode: 'feature' | 'cluster' = 'feature';
  public saving = false;
  public loading = true;
  public noApiKey = false;
  public clusters: RockExplorerCluster[] = [];

  public potentialOptions = Object.values(RockExplorerPotential);
  public rockQualityOptions = Object.values(RockExplorerRockQuality);
  public rockTypeOptions = Object.values(RockExplorerRockType);
  public accessIssueOptions = Object.values(RockExplorerAccessIssue);
  public lineTypeOptions = Object.values(LineType);
  public mapStyleOptions = [
    { value: MapStyles.TOPO, labelKey: marker('rockExplorer.mapStyle.topo') },
    {
      value: MapStyles.SATELLITE,
      labelKey: marker('rockExplorer.mapStyle.satellite'),
    },
  ];

  public filterForm = inject(FormBuilder).group({
    potential: [null as string | null],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
  });

  public featureForm = inject(FormBuilder).group({
    title: [''],
    description: [''],
    potential: [null as string | null],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
    gradeLineType: [null as string | null],
    gradeScale: [''],
    gradeValueMin: [null as number | null],
    gradeValueMax: [null as number | null],
    accessIssues: [[] as string[]],
  });

  public clusterForm = inject(FormBuilder).group({
    title: [''],
    description: [''],
    potential: [null as string | null],
    rockQuality: [null as string | null],
    rockType: [null as string | null],
    gradeLineType: [null as string | null],
    gradeScale: [''],
    gradeValueMin: [null as number | null],
    gradeValueMax: [null as number | null],
    accessIssues: [[] as string[]],
  });

  public editingFeature: RockExplorerFeature | null = null;
  public editingCluster: RockExplorerCluster | null = null;

  private map?: MaplibreMap;
  private apiKey = '';
  private features: FeatureCollection<Geometry> = {
    type: 'FeatureCollection',
    features: [],
  };
  private clusterHulls: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: [],
  };
  private draftGeometry: Geometry | null = null;
  private polygonVertices: Position[] = [];
  private destroyRef = inject(DestroyRef);
  private store = inject(Store);
  private rockExplorerService = inject(RockExplorerService);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private transloco = inject(TranslocoService);

  ngAfterViewInit() {
    forkJoin([
      this.store.select(selectInstanceSettingsState).pipe(take(1)),
      this.rockExplorerService.getFeaturesGeoJSON(),
      this.rockExplorerService.getClusters(),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([settings, collection, clusters]) => {
          this.apiKey = settings.maptilerApiKey;
          this.features = collection;
          this.clusters = clusters;
          this.loading = false;
          if (!this.apiKey) {
            this.noApiKey = true;
            this.cdr.detectChanges();
            return;
          }
          this.cdr.detectChanges();
          this.initMap();
        },
        error: () => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(marker('rockExplorer.loadError')),
          });
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  public setDrawMode(mode: DrawMode) {
    this.drawMode = mode;
    this.polygonVertices = [];
    this.clearDraftLayer();
    if (mode !== 'select') {
      this.closePanel();
    }
  }

  public toggleFilters() {
    this.showFilters = !this.showFilters;
  }

  public applyFilters() {
    const value = this.filterForm.getRawValue();
    this.reloadFeatures({
      potential: value.potential || undefined,
      rockQuality: value.rockQuality || undefined,
      rockType: value.rockType || undefined,
    });
  }

  public clearFilters() {
    this.filterForm.reset({
      potential: null,
      rockQuality: null,
      rockType: null,
    });
    this.reloadFeatures();
  }

  public switchMapStyle(style: MapStyles) {
    if (!this.map || !this.apiKey || this.mapStyle === style) {
      return;
    }
    this.mapStyle = style;
    const url = this.styleUrl(style);
    this.map.setStyle(url);
    this.map.once('style.load', () => {
      this.addFeatureLayers();
      this.setFeatureData(this.features);
    });
  }

  public saveFeature() {
    if (!this.draftGeometry && !this.editingFeature) {
      return;
    }
    const raw = this.featureForm.getRawValue();
    const feature = this.editingFeature
      ? this.editingFeature
      : new RockExplorerFeature();
    feature.title = raw.title?.trim() || null;
    feature.description = raw.description?.trim() || null;
    feature.potential = (raw.potential as RockExplorerPotential) || null;
    feature.rockQuality = (raw.rockQuality as RockExplorerRockQuality) || null;
    feature.rockType = (raw.rockType as RockExplorerRockType) || null;
    feature.gradeLineType = (raw.gradeLineType as LineType) || null;
    feature.gradeScale = raw.gradeScale?.trim() || null;
    feature.gradeValueMin = raw.gradeValueMin;
    feature.gradeValueMax = raw.gradeValueMax;
    feature.accessIssues = (raw.accessIssues ||
      []) as RockExplorerAccessIssue[];
    feature.geometry = (this.draftGeometry ||
      this.editingFeature!.geometry) as Geometry;
    feature.clusterId = feature.clusterId ?? null;
    feature.cragId = feature.cragId ?? null;
    feature.sectorId = feature.sectorId ?? null;
    feature.areaId = feature.areaId ?? null;
    feature.lineId = feature.lineId ?? null;

    this.saving = true;
    const request$ = feature.id
      ? this.rockExplorerService.updateFeature(feature)
      : this.rockExplorerService.createFeature(feature);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving = false;
        this.closePanel();
        this.setDrawMode('select');
        this.reloadFeatures(this.currentFilters());
        this.messageService.add({
          severity: 'success',
          summary: this.transloco.translate(marker('rockExplorer.saveSuccess')),
        });
      },
      error: () => {
        this.saving = false;
        this.messageService.add({
          severity: 'error',
          summary: this.transloco.translate(marker('rockExplorer.saveError')),
        });
      },
    });
  }

  public confirmDelete() {
    if (!this.editingFeature?.id) {
      return;
    }
    this.confirmationService.confirm({
      message: this.transloco.translate(marker('rockExplorer.deleteConfirm')),
      accept: () => this.deleteFeature(),
    });
  }

  public openClusterPanel(clusterId: string) {
    this.rockExplorerService
      .getCluster(clusterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cluster) => {
          this.editingCluster = cluster;
          this.panelMode = 'cluster';
          this.clusterForm.patchValue({
            title: cluster.title ?? '',
            description: cluster.description ?? '',
            potential: cluster.potential,
            rockQuality: cluster.rockQuality,
            rockType: cluster.rockType,
            gradeLineType: cluster.gradeLineType,
            gradeScale: cluster.gradeScale ?? '',
            gradeValueMin: cluster.gradeValueMin,
            gradeValueMax: cluster.gradeValueMax,
            accessIssues: cluster.accessIssues ?? [],
          });
          this.panelOpen = true;
          this.cdr.detectChanges();
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.clusterLoadError'),
            ),
          });
        },
      });
  }

  public saveCluster() {
    if (!this.editingCluster) {
      return;
    }
    const raw = this.clusterForm.getRawValue();
    const cluster = this.editingCluster;
    cluster.title = raw.title?.trim() || null;
    cluster.description = raw.description?.trim() || null;
    cluster.potential = (raw.potential as RockExplorerPotential) || null;
    cluster.rockQuality = (raw.rockQuality as RockExplorerRockQuality) || null;
    cluster.rockType = (raw.rockType as RockExplorerRockType) || null;
    cluster.gradeLineType = (raw.gradeLineType as LineType) || null;
    cluster.gradeScale = raw.gradeScale?.trim() || null;
    cluster.gradeValueMin = raw.gradeValueMin;
    cluster.gradeValueMax = raw.gradeValueMax;
    cluster.accessIssues = (raw.accessIssues ||
      []) as RockExplorerAccessIssue[];

    this.saving = true;
    this.rockExplorerService
      .updateCluster(cluster)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving = false;
          this.closePanel();
          this.reloadClusters();
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate(
              marker('rockExplorer.clusterSaveSuccess'),
            ),
          });
        },
        error: () => {
          this.saving = false;
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.clusterSaveError'),
            ),
          });
        },
      });
  }

  public confirmDeleteCluster() {
    if (!this.editingCluster?.id) {
      return;
    }
    this.confirmationService.confirm({
      message: this.transloco.translate(
        marker('rockExplorer.deleteClusterConfirm'),
      ),
      accept: () => this.deleteCluster(),
    });
  }

  public clusterMemberFeatures(): { id: string; title: string }[] {
    if (!this.editingCluster) {
      return [];
    }
    const memberIds = new Set(this.editingCluster.featureIds ?? []);
    return this.features.features
      .filter((feature) => memberIds.has(String(feature.properties?.['id'])))
      .map((feature) => ({
        id: String(feature.properties?.['id']),
        title: feature.properties?.['title'] ?? '',
      }));
  }

  public closePanel() {
    this.panelOpen = false;
    this.panelMode = 'feature';
    this.editingFeature = null;
    this.editingCluster = null;
    this.draftGeometry = null;
    this.featureForm.reset({
      title: '',
      description: '',
      potential: null,
      rockQuality: null,
      rockType: null,
      gradeLineType: null,
      gradeScale: '',
      gradeValueMin: null,
      gradeValueMax: null,
      accessIssues: [],
    });
    this.clusterForm.reset({
      title: '',
      description: '',
      potential: null,
      rockQuality: null,
      rockType: null,
      gradeLineType: null,
      gradeScale: '',
      gradeValueMin: null,
      gradeValueMax: null,
      accessIssues: [],
    });
  }

  public finishPolygon() {
    if (this.drawMode !== 'polygon' || this.polygonVertices.length < 3) {
      return;
    }
    const ring = [...this.polygonVertices, this.polygonVertices[0]];
    this.openCreatePanel({ type: 'Polygon', coordinates: [ring] });
    this.polygonVertices = [];
    this.clearDraftLayer();
  }

  private deleteFeature() {
    if (!this.editingFeature) {
      return;
    }
    this.rockExplorerService
      .deleteFeature(this.editingFeature)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closePanel();
          this.reloadFeatures(this.currentFilters());
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate(
              marker('rockExplorer.deleteSuccess'),
            ),
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.deleteError'),
            ),
          });
        },
      });
  }

  private deleteCluster() {
    if (!this.editingCluster) {
      return;
    }
    this.rockExplorerService
      .deleteCluster(this.editingCluster)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.closePanel();
          this.reloadClusters();
          this.reloadFeatures(this.currentFilters());
          this.messageService.add({
            severity: 'success',
            summary: this.transloco.translate(
              marker('rockExplorer.clusterDeleteSuccess'),
            ),
          });
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: this.transloco.translate(
              marker('rockExplorer.clusterDeleteError'),
            ),
          });
        },
      });
  }

  private reloadClusters() {
    this.rockExplorerService
      .getClusters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((clusters) => {
        this.clusters = clusters;
        this.cdr.detectChanges();
      });
  }

  private initMap() {
    const el = this.mapContainer?.nativeElement;
    if (!el) {
      return;
    }
    this.map = new MaplibreMap({
      container: el,
      style: this.styleUrl(this.mapStyle),
      center: [10, 50],
      zoom: 5,
    });
    this.map.addControl(new NavigationControl({}), 'top-right');
    this.map.addControl(
      new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right',
    );
    this.map.on('load', () => {
      this.addFeatureLayers();
      this.setFeatureData(this.features);
      this.fitToFeatures();
      this.map!.on('click', (event) => this.onMapClick(event));
      this.map!.on('click', 'rock-explorer-points', (event) => {
        event.originalEvent.stopPropagation();
        const id = event.features?.[0]?.properties?.['id'];
        if (id && this.drawMode === 'select') {
          this.openEditPanel(String(id));
        }
      });
      this.map!.on('click', 'rock-explorer-polygons-fill', (event) => {
        event.originalEvent.stopPropagation();
        const id = event.features?.[0]?.properties?.['id'];
        if (id && this.drawMode === 'select') {
          this.openEditPanel(String(id));
        }
      });
      this.map!.on('click', 'rock-explorer-cluster-hull-fill', (event) => {
        if (this.drawMode !== 'select') {
          return;
        }
        const featureHits = this.map!.queryRenderedFeatures(event.point, {
          layers: ['rock-explorer-points', 'rock-explorer-polygons-fill'],
        });
        if (featureHits.length > 0) {
          return;
        }
        const clusterId = event.features?.[0]?.properties?.['clusterId'];
        if (clusterId) {
          this.openClusterPanel(String(clusterId));
        }
      });
      this.map!.on('mouseenter', 'rock-explorer-cluster-hull-fill', () => {
        this.map!.getCanvas().style.cursor = 'pointer';
      });
      this.map!.on('mouseleave', 'rock-explorer-cluster-hull-fill', () => {
        this.map!.getCanvas().style.cursor = '';
      });
    });
  }

  private onMapClick(event: MapMouseEvent) {
    if (this.drawMode === 'point') {
      this.openCreatePanel({
        type: 'Point',
        coordinates: [event.lngLat.lng, event.lngLat.lat],
      });
      return;
    }
    if (this.drawMode === 'polygon') {
      this.polygonVertices.push([event.lngLat.lng, event.lngLat.lat]);
      this.renderPolygonDraft();
    }
  }

  private openCreatePanel(geometry: Geometry) {
    this.panelMode = 'feature';
    this.editingFeature = null;
    this.editingCluster = null;
    this.draftGeometry = geometry;
    this.featureForm.reset({
      title: '',
      description: '',
      potential: null,
      rockQuality: null,
      rockType: null,
      gradeLineType: null,
      gradeScale: '',
      gradeValueMin: null,
      gradeValueMax: null,
      accessIssues: [],
    });
    this.panelOpen = true;
    this.cdr.detectChanges();
  }

  public openEditPanel(id: string) {
    this.rockExplorerService
      .getFeature(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((feature) => {
        this.panelMode = 'feature';
        this.editingFeature = feature;
        this.editingCluster = null;
        this.draftGeometry = feature.geometry;
        this.featureForm.patchValue({
          title: feature.title ?? '',
          description: feature.description ?? '',
          potential: feature.potential,
          rockQuality: feature.rockQuality,
          rockType: feature.rockType,
          gradeLineType: feature.gradeLineType,
          gradeScale: feature.gradeScale ?? '',
          gradeValueMin: feature.gradeValueMin,
          gradeValueMax: feature.gradeValueMax,
          accessIssues: feature.accessIssues ?? [],
        });
        this.panelOpen = true;
        this.cdr.detectChanges();
      });
  }

  private reloadFeatures(
    filters: {
      potential?: string;
      rockQuality?: string;
      rockType?: string;
    } = {},
  ) {
    this.rockExplorerService
      .getFeaturesGeoJSON(filters)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((collection) => {
        this.features = collection;
        this.setFeatureData(collection);
        this.fitToFeatures();
      });
  }

  private currentFilters() {
    const value = this.filterForm.getRawValue();
    return {
      potential: value.potential || undefined,
      rockQuality: value.rockQuality || undefined,
      rockType: value.rockType || undefined,
    };
  }

  private styleUrl(style: MapStyles): string {
    if (style === MapStyles.SATELLITE) {
      return `https://api.maptiler.com/maps/satellite/style.json?key=${this.apiKey}`;
    }
    return `https://api.maptiler.com/maps/topo-v2/style.json?key=${this.apiKey}`;
  }

  private addFeatureLayers() {
    if (!this.map) {
      return;
    }
    if (!this.map.getSource('rock-explorer-features')) {
      this.map.addSource('rock-explorer-features', {
        type: 'geojson',
        data: this.features,
      });
    }
    if (!this.map.getSource('rock-explorer-draft')) {
      this.map.addSource('rock-explorer-draft', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
    }
    if (!this.map.getSource('rock-explorer-cluster-hulls')) {
      this.map.addSource('rock-explorer-cluster-hulls', {
        type: 'geojson',
        data: this.clusterHulls,
      });
    }
    if (!this.map.getLayer('rock-explorer-cluster-hull-fill')) {
      this.map.addLayer({
        id: 'rock-explorer-cluster-hull-fill',
        type: 'fill',
        source: 'rock-explorer-cluster-hulls',
        paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 },
      });
      this.map.addLayer({
        id: 'rock-explorer-cluster-hull-outline',
        type: 'line',
        source: 'rock-explorer-cluster-hulls',
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });
    }
    if (!this.map.getLayer('rock-explorer-polygons-fill')) {
      this.map.addLayer({
        id: 'rock-explorer-polygons-fill',
        type: 'fill',
        source: 'rock-explorer-features',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'fill-color': '#c45c26',
          'fill-opacity': 0.35,
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-polygons-outline',
        type: 'line',
        source: 'rock-explorer-features',
        filter: ['==', ['geometry-type'], 'Polygon'],
        paint: {
          'line-color': '#8a3a12',
          'line-width': 2,
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-points',
        type: 'circle',
        source: 'rock-explorer-features',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 7,
          'circle-color': '#c45c26',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-draft-line',
        type: 'line',
        source: 'rock-explorer-draft',
        paint: {
          'line-color': '#2563eb',
          'line-width': 2,
          'line-dasharray': [2, 1],
        },
      });
      this.map.addLayer({
        id: 'rock-explorer-draft-points',
        type: 'circle',
        source: 'rock-explorer-draft',
        filter: ['==', ['geometry-type'], 'Point'],
        paint: {
          'circle-radius': 5,
          'circle-color': '#2563eb',
        },
      });
    }
  }

  private setFeatureData(collection: FeatureCollection<Geometry>) {
    const source = this.map?.getSource('rock-explorer-features') as
      | GeoJSONSource
      | undefined;
    source?.setData(collection);
    this.clusterHulls = computeClusterHulls(collection);
    (
      this.map?.getSource('rock-explorer-cluster-hulls') as
        | GeoJSONSource
        | undefined
    )?.setData(this.clusterHulls);
  }

  private fitToFeatures() {
    if (!this.map || this.features.features.length === 0) {
      return;
    }
    const bounds = new LngLatBounds();
    let hasCoord = false;
    for (const feature of this.features.features) {
      const geom = feature.geometry;
      if (geom.type === 'Point') {
        bounds.extend(geom.coordinates as [number, number]);
        hasCoord = true;
      } else if (geom.type === 'Polygon') {
        for (const coord of geom.coordinates[0]) {
          bounds.extend(coord as [number, number]);
          hasCoord = true;
        }
      }
    }
    if (hasCoord) {
      this.map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
    }
  }

  private renderPolygonDraft() {
    const source = this.map?.getSource('rock-explorer-draft') as
      | GeoJSONSource
      | undefined;
    if (!source) {
      return;
    }
    const features: Feature[] = this.polygonVertices.map((coords) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: coords },
      properties: {},
    }));
    if (this.polygonVertices.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: this.polygonVertices,
        },
        properties: {},
      });
    }
    source.setData({ type: 'FeatureCollection', features });
  }

  private clearDraftLayer() {
    const source = this.map?.getSource('rock-explorer-draft') as
      | GeoJSONSource
      | undefined;
    source?.setData({ type: 'FeatureCollection', features: [] });
  }
}
