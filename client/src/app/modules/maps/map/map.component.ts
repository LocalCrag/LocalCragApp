import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import {
  GeolocateControl,
  LngLat,
  LngLatBounds,
  Map as MaplibreMap,
  NavigationControl,
} from 'maplibre-gl';
import { MapsService } from '../../../services/crud/maps.service';
import { Feature, FeatureCollection, Geometry, Point } from 'geojson';
import { MapMarkerProperties } from '../../../models/map-marker';
import { MapItemInfoDialogComponent } from '../map-item-info-dialog/map-item-info-dialog.component';
import { Area } from '../../../models/area';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { forkJoin, from, mergeMap, Observable, toArray } from 'rxjs';
import { MapMarkerType } from '../../../enums/map-marker-type';
import { NgIf } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';
import { MapStyles } from '../../../enums/map-styles';

@Component({
  selector: 'lc-map',
  standalone: true,
  imports: [MapItemInfoDialogComponent, TranslocoDirective, NgIf],
  templateUrl: './map.component.html',
  styleUrl: './map.component.scss',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input() target: Crag | Sector | Area | undefined;
  @Input() mapStyle: MapStyles = MapStyles.TOPO;

  public map: MaplibreMap | undefined;
  public markersSource:
    | FeatureCollection<Point, MapMarkerProperties>
    | undefined;
  public apiKey: string;

  @ViewChild('map')
  private mapContainer!: ElementRef<HTMLElement>;
  @ViewChild(MapItemInfoDialogComponent)
  private infoDialog: MapItemInfoDialogComponent | undefined;

  constructor(
    private mapsService: MapsService,
    private cdr: ChangeDetectorRef,
    private store: Store,
    private translocoService: TranslocoService,
  ) {}

  addMissingMarkerNames() {
    this.markersSource.features.map((feature) => {
      if (!feature.properties.name) {
        if (feature.properties.type === MapMarkerType.ACCESS_POINT) {
          feature.properties.name = this.translocoService.translate(
            marker('maps.mapMarkerForm.ACCESS_POINT'),
          );
        }
        if (feature.properties.type === MapMarkerType.PARKING) {
          feature.properties.name = this.translocoService.translate(
            marker('maps.mapMarkerForm.PARKING'),
          );
        }
        // We don't add a default name for OTHER markers, as they are supposed to be custom
        // Also crags etc. always have a name
      }
    });
  }

  ngAfterViewInit() {
    let filters = '';
    if (this.target instanceof Crag) {
      filters = `?crag-id=${this.target.id}`;
    }
    if (this.target instanceof Sector) {
      filters = `?sector-id=${this.target.id}`;
    }
    if (this.target instanceof Area) {
      filters = `?area-id=${this.target.id}`;
    }
    forkJoin([
      this.mapsService.getMarkersGeoJSON(filters),
      this.store.select(selectInstanceSettingsState).pipe(take(1)),
    ]).subscribe(([markersSource, instanceSettingsState]) => {
      let mapStyleUrl = '';
      this.apiKey = instanceSettingsState.maptilerApiKey;
      switch (this.mapStyle) {
        case MapStyles.TOPO:
          mapStyleUrl = `https://api.maptiler.com/maps/topo-v2/style.json?key=${this.apiKey}`;
          break;
        case MapStyles.SATELLITE:
          mapStyleUrl = `https://api.maptiler.com/maps/satellite/style.json?key=${this.apiKey}`;
          break;
      }
      this.markersSource = markersSource;
      if (!(this.markersSource?.features?.length > 0 || !this.apiKey)) {
        return;
      }
      this.cdr.detectChanges();
      this.addMissingMarkerNames();
      this.map = new MaplibreMap({
        container: this.mapContainer.nativeElement,
        style: mapStyleUrl,
        zoom: 10,
      });
      this.map.addControl(new NavigationControl({}), 'top-right');
      this.map.on('load', () => {
        const images = [
          { name: 'rock', path: 'assets/icons/rock.svg' },
          { name: 'access', path: 'assets/icons/access.svg' },
          { name: 'lc-parking', path: 'assets/icons/parking.svg' },
          { name: 'info', path: 'assets/icons/info.svg' },
          { name: 'boulder', path: 'assets/icons/boulder.svg' },
        ];
        from(images)
          .pipe(
            mergeMap(
              (image) =>
                new Observable((observer) => {
                  const img = new Image(100, 100);
                  img.onload = () => {
                    this.map.addImage(image.name, img);
                    observer.next(null);
                    observer.complete();
                  };
                  img.src = image.path;
                }),
            ),
            toArray(),
          )
          .subscribe(() => {
            this.addSource();
            this.addLayers();
            this.addCurrentLocation();
            this.setupClickActions();
            this.setupCursors();
          });
      });
      this.fitBounds();
    });
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  fitBounds() {
    const lngs = this.markersSource.features.map(
      (feature) => feature.geometry.coordinates[0],
    );
    const lats = this.markersSource.features.map(
      (feature) => feature.geometry.coordinates[1],
    );
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const sw = new LngLat(minLng, minLat);
    const ne = new LngLat(maxLng, maxLat);
    const bounds = new LngLatBounds(sw, ne);
    this.map.fitBounds(bounds, {
      duration: 0,
      padding: { top: 50, bottom: 50, left: 25, right: 25 },
      maxZoom: 18,
    });
  }

  addSource() {
    this.map.addSource('mapMarkers', {
      type: 'geojson',
      data: this.markersSource,
      cluster: true,
      clusterRadius: 50,
      clusterMinPoints: 2,
      tolerance: 0,
    });
  }

  addCurrentLocation() {
    this.map.addControl(
      new GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
    );
  }

  addLayers() {
    this.map.addLayer({
      id: 'rocks',
      type: 'symbol',
      source: 'mapMarkers',
      filter: ['!', ['has', 'point_count']],
      layout: {
        'text-field': ['get', 'name'],
        'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
        'text-radial-offset': 1.5,
        'text-justify': 'auto',
        'icon-image': [
          'match',
          ['get', 'type'],
          'TOPO_IMAGE',
          'boulder',
          'AREA',
          'rock',
          'SECTOR',
          'rock',
          'CRAG',
          'rock',
          'PARKING',
          'lc-parking',
          'ACCESS_POINT',
          'access',
          'OTHER',
          'info',
          'info', // Fallback icon
        ],
        'icon-size': 0.4,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });

    this.map.addLayer({
      id: 'clusters',
      type: 'circle',
      source: 'mapMarkers',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#4B89DC',
        'circle-radius': 30,
      },
    });
    this.map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'mapMarkers',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count}',
      },
    });
  }

  setupCursors() {
    this.map.on('mouseenter', 'clusters', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'clusters', () => {
      this.map.getCanvas().style.cursor = '';
    });
    this.map.on('mouseenter', 'rocks', () => {
      this.map.getCanvas().style.cursor = 'pointer';
    });
    this.map.on('mouseleave', 'rocks', () => {
      this.map.getCanvas().style.cursor = '';
    });
  }

  setupClickActions() {
    this.map.on('click', 'clusters', async (e) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });
      const clusterId = features[0].properties.cluster_id;
      const zoom = await (
        this.map.getSource('mapMarkers') as any
      ).getClusterExpansionZoom(clusterId);
      this.map.easeTo({
        center: (features[0].geometry as any).coordinates,
        zoom,
      });
    });
    this.map.on('click', 'rocks', (e) => {
      const feature = e.features[0] as unknown as Feature<
        Geometry,
        MapMarkerProperties
      >;
      for (const key in feature.properties) {
        if (typeof feature.properties[key] === 'string') {
          try {
            feature.properties[key] = JSON.parse(
              feature.properties[key] as string,
            );
          } catch (e) {
            continue;
          }
        }
      }
      this.infoDialog.open(feature);
    });
  }
}
